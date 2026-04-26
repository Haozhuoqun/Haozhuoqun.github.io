/**
 * 主应用逻辑 — UI 交互和 Plotly 图表渲染
 * 支持两种模式：
 *   光谱扫描 — 固定厚度，T vs 波长
 *   厚度扫描 — 固定波长，T vs 厚度
 */

// --- DOM 元素 ---
const metalSelect = document.getElementById('metal-select');
const thicknessSlider = document.getElementById('thickness-slider');
const thicknessValue = document.getElementById('thickness-value');
const wavelengthSlider = document.getElementById('wavelength-slider');
const wavelengthValue = document.getElementById('wavelength-value');
const displaySelect = document.getElementById('display-select');
const substrateSelect = document.getElementById('substrate-select');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const toggleLabels = document.querySelectorAll('.toggle-option');

const infoMetal = document.getElementById('info-metal');
const infoThickness = document.getElementById('info-thickness');
const infoFixedWavelength = document.getElementById('info-fixed-wavelength');
const infoTmax = document.getElementById('info-Tmax');
const infoTmin = document.getElementById('info-Tmin');
const infoTavg = document.getElementById('info-Tavg');
const infoThicknessCard = document.getElementById('info-thickness-card');
const infoWavelengthCard = document.getElementById('info-wavelength-card');
const thicknessControl = document.getElementById('thickness-control');
const wavelengthControl = document.getElementById('wavelength-control');

// --- 当前模式 ---
let currentMode = 'spectral'; // 'spectral' | 'thickness'

// --- Plotly 布局（深色主题，动态 x/y 轴） ---
function buildLayout(mode) {
  const isSpectral = mode === 'spectral';
  return {
    title: {
      text: isSpectral ? '光谱响应曲线' : '厚度扫描曲线',
      font: { color: '#e0e0e0', size: 16 }
    },
    xaxis: {
      title: {
        text: isSpectral ? '波长 (nm)' : '薄膜厚度 (nm)',
        font: { color: '#aaa' }
      },
      range: isSpectral ? [400, 1400] : [0, 200],
      color: '#aaa',
      gridcolor: '#2a2a4a',
      zerolinecolor: '#2a2a4a',
      dtick: isSpectral ? 100 : 20
    },
    yaxis: {
      title: { text: '比例 (0–1)', font: { color: '#aaa' } },
      range: [0, 1],
      color: '#aaa',
      gridcolor: '#2a2a4a',
      zerolinecolor: '#2a2a4a'
    },
    paper_bgcolor: '#1a1a2e',
    plot_bgcolor: '#1a1a2e',
    hovermode: 'x unified',
    legend: {
      font: { color: '#e0e0e0' },
      orientation: 'h',
      y: 1.12,
      x: 0.5,
      xanchor: 'center'
    },
    margin: { l: 60, r: 30, t: 60, b: 60 }
  };
}

const DISPLAY_CONFIG = {
  T: { label: '透光率 (T)', color: '#4ecdc4', width: 2 },
  R: { label: '反射率 (R)', color: '#ff6b6b', width: 2 },
  A: { label: '吸收率 (A)', color: '#ffd93d', width: 2 }
};

// ============ 光谱扫描 (当前行为) ============

/**
 * 光谱扫描：固定厚度，扫波长 400–1400nm，步长 2nm
 */
function getSpectralScan(metalKey, thickness, nSub) {
  const metal = METALS_DATA[metalKey];
  if (!metal) return [];

  const n0 = 1.0;
  const results = [];

  for (let lam = 400; lam <= 1400; lam += 2) {
    const { n, k } = getOpticalConstants(metalKey, lam);
    const N1 = { re: n, im: k };
    const { T, R, A } = calculateThinFilm(n0, N1, nSub, thickness, lam);
    results.push({ wavelength: lam, T, R, A });
  }

  return results;
}

// ============ 厚度扫描 (新增) ============

/**
 * 厚度扫描：固定波长，扫厚度 1–200nm，步长 1nm
 */
function getThicknessScan(metalKey, wavelength, nSub) {
  const metal = METALS_DATA[metalKey];
  if (!metal) return [];

  const n0 = 1.0;
  const { n, k } = getOpticalConstants(metalKey, wavelength);
  const N1 = { re: n, im: k };
  const results = [];

  for (let d = 1; d <= 200; d += 1) {
    const { T, R, A } = calculateThinFilm(n0, N1, nSub, d, wavelength);
    results.push({ thickness: d, T, R, A });
  }

  return results;
}

// ============ 图表更新 ============

function makeTraces(data, displayMode, mode) {
  const isSpectral = mode === 'spectral';
  const xKey = isSpectral ? 'wavelength' : 'thickness';
  const xVals = data.map(d => d[xKey]);
  const traces = [];

  if (displayMode === 'all') {
    traces.push({
      x: xVals, y: data.map(d => d.T),
      type: 'scatter', mode: 'lines',
      name: DISPLAY_CONFIG.T.label,
      line: { color: DISPLAY_CONFIG.T.color, width: 2 }
    });
    traces.push({
      x: xVals, y: data.map(d => d.R),
      type: 'scatter', mode: 'lines',
      name: DISPLAY_CONFIG.R.label,
      line: { color: DISPLAY_CONFIG.R.color, width: 2 }
    });
    traces.push({
      x: xVals, y: data.map(d => d.A),
      type: 'scatter', mode: 'lines',
      name: DISPLAY_CONFIG.A.label,
      line: { color: DISPLAY_CONFIG.A.color, width: 2, dash: 'dot' }
    });
  } else {
    const cfg = DISPLAY_CONFIG[displayMode];
    traces.push({
      x: xVals, y: data.map(d => d[displayMode]),
      type: 'scatter', mode: 'lines',
      name: cfg.label,
      line: { color: cfg.color, width: 2.5 },
      fill: 'tozeroy',
      fillcolor: cfg.color + '22'
    });
  }

  return traces;
}

function updateChart() {
  const metalKey = metalSelect.value;
  const displayMode = displaySelect.value;
  const nSub = parseFloat(substrateSelect.value);
  const metal = METALS_DATA[metalKey];

  let data;
  if (currentMode === 'spectral') {
    const thickness = parseFloat(thicknessSlider.value);
    data = getSpectralScan(metalKey, thickness, nSub);
  } else {
    const wavelength = parseFloat(wavelengthSlider.value);
    data = getThicknessScan(metalKey, wavelength, nSub);
  }

  if (data.length === 0) return;

  const traces = makeTraces(data, displayMode, currentMode);
  const layout = buildLayout(currentMode);

  Plotly.react('chart', traces, layout, { responsive: true, displayModeBar: true });

  // 信息面板
  const Tvalues = data.map(d => d.T);
  const Tmax = Math.max(...Tvalues);
  const Tmin = Math.min(...Tvalues);
  const Tavg = Tvalues.reduce((s, v) => s + v, 0) / Tvalues.length;

  infoMetal.textContent = `${metal.name} (${metal.symbol})`;
  infoTmax.textContent = (Tmax * 100).toFixed(1) + '%';
  infoTmin.textContent = (Tmin * 100).toFixed(1) + '%';
  infoTavg.textContent = (Tavg * 100).toFixed(1) + '%';

  if (currentMode === 'spectral') {
    infoThickness.textContent = `${thicknessSlider.value} nm`;
  } else {
    infoFixedWavelength.textContent = `${wavelengthSlider.value} nm`;
  }
}

// ============ 模式切换 ============

function switchMode(mode) {
  currentMode = mode;

  // 切换按钮高亮
  toggleLabels.forEach(el => el.classList.toggle('active', el.dataset.mode === mode));

  // 切换控件显示
  const isSpectral = mode === 'spectral';
  thicknessControl.style.display = isSpectral ? '' : 'none';
  wavelengthControl.style.display = isSpectral ? 'none' : '';
  infoThicknessCard.style.display = isSpectral ? '' : 'none';
  infoWavelengthCard.style.display = isSpectral ? 'none' : '';

  updateChart();
}

// ============ 显示值更新 ============

function updateThicknessDisplay() {
  thicknessValue.textContent = thicknessSlider.value;
}

function updateWavelengthDisplay() {
  wavelengthValue.textContent = wavelengthSlider.value;
}

// ============ 事件绑定 ============

modeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.checked) switchMode(radio.value);
  });
});

metalSelect.addEventListener('change', updateChart);
displaySelect.addEventListener('change', updateChart);
substrateSelect.addEventListener('change', updateChart);

// 厚度滑块（光谱模式）
thicknessSlider.addEventListener('change', updateChart);
let throttleThickness = null;
thicknessSlider.addEventListener('input', () => {
  updateThicknessDisplay();
  if (currentMode !== 'spectral') return;
  if (throttleThickness) return;
  throttleThickness = setTimeout(() => {
    updateChart();
    throttleThickness = null;
  }, 30);
});

// 波长滑块（厚度扫描模式）
wavelengthSlider.addEventListener('change', updateChart);
let throttleWavelength = null;
wavelengthSlider.addEventListener('input', () => {
  updateWavelengthDisplay();
  if (currentMode !== 'thickness') return;
  if (throttleWavelength) return;
  throttleWavelength = setTimeout(() => {
    updateChart();
    throttleWavelength = null;
  }, 30);
});

// ============ 初始化 ============
updateChart();
