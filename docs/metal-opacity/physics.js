/**
 * 物理计算引擎 — 传输矩阵法 (Transfer Matrix Method, TMM)
 * 计算单层金属薄膜在正入射下的透光率、反射率、吸收率
 *
 * 模型：空气 (n=1) → 金属薄膜 (Ñ=n+ik) → 玻璃基底 (n=1.5)
 *
 * 使用 Airy 公式（等价于 TMM）：
 *   t_total = t01·t12·e^(iβ) / (1 + r01·r12·e^(2iβ))
 *   r_total = (r01 + r12·e^(2iβ)) / (1 + r01·r12·e^(2iβ))
 *   β = 2π·Ñ·d / λ
 */

// --- 复数运算工具箱 ---
const C = {
  from(re, im) { return { re, im }; },
  add(a, b) { return { re: a.re + b.re, im: a.im + b.im }; },
  sub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; },
  mul(a, b) {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re
    };
  },
  div(a, b) {
    const d = b.re * b.re + b.im * b.im;
    return {
      re: (a.re * b.re + a.im * b.im) / d,
      im: (a.im * b.re - a.re * b.im) / d
    };
  },
  exp(c) {
    const m = Math.exp(c.re);
    return { re: m * Math.cos(c.im), im: m * Math.sin(c.im) };
  },
  abs2(c) {
    return c.re * c.re + c.im * c.im;
  }
};

/**
 * 计算单层薄膜的透光率、反射率、吸收率
 * @param {number} n0   — 入射介质折射率 (空气 ≈ 1)
 * @param {{re:number,im:number}} N1 — 薄膜复折射率
 * @param {number} n2   — 基底折射率 (玻璃 ≈ 1.5)
 * @param {number} d    — 薄膜厚度 (nm)
 * @param {number} lam  — 波长 (nm)
 * @returns {{T:number, R:number, A:number}}
 */
function calculateThinFilm(n0, N1, n2, d, lam) {
  const N0 = C.from(n0, 0);
  const N2 = C.from(n2, 0);

  // Fresnel 系数 — 界面 0→1 (空气→金属)
  const r01 = C.div(C.sub(N0, N1), C.add(N0, N1));
  const t01 = C.div(C.from(2 * n0, 0), C.add(N0, N1));

  // Fresnel 系数 — 界面 1→2 (金属→基底)
  const r12 = C.div(C.sub(N1, N2), C.add(N1, N2));
  const t12 = C.div(C.mul(C.from(2, 0), N1), C.add(N1, N2));

  // 传播相位 β = 2π·Ñ·d / λ
  const beta = C.from(
    (2 * Math.PI * N1.re * d) / lam,
    (2 * Math.PI * N1.im * d) / lam
  );

  // e^(iβ) = e^(-Im(β)) · e^(i·Re(β))
  const e_ibeta = C.exp({ re: -beta.im, im: beta.re });
  // e^(2iβ)
  const e_i2beta = C.exp({ re: -2 * beta.im, im: 2 * beta.re });

  // 分母 D = 1 + r01·r12·e^(2iβ)
  const denom = C.add(C.from(1, 0), C.mul(C.mul(r01, r12), e_i2beta));

  // 透射系数 t_total = t01·t12·e^(iβ) / D
  const t_total = C.div(C.mul(C.mul(t01, t12), e_ibeta), denom);

  // 反射系数 r_total = (r01 + r12·e^(2iβ)) / D
  const r_total = C.div(C.add(r01, C.mul(r12, e_i2beta)), denom);

  // 透光率 T = Re(N2)/Re(N0) · |t|²
  const T = (n2 / n0) * C.abs2(t_total);

  // 反射率 R = |r|²
  const R = C.abs2(r_total);

  // 吸收率 A = 1 − T − R
  const A = Math.max(0, Math.min(1, 1 - T - R));

  return { T, R, A };
}

/**
 * 计算给定金属和厚度下的完整光谱
 * @param {string} metalKey — 金属键名 (Ag/Au/Cu/W)
 * @param {number} thickness — 薄膜厚度 (nm)
 * @param {number} [nSub=1.5] — 基底折射率
 * @returns {Array<{wavelength:number, T:number, R:number, A:number}>}
 */
function calculateSpectrum(metalKey, thickness, nSub) {
  if (nSub === undefined) nSub = 1.5;
  const n0 = 1.0;

  const metal = METALS_DATA[metalKey];
  if (!metal) return [];

  const results = [];
  const wls = metal.wavelengths;

  for (let i = 0; i < wls.length; i++) {
    const lam = wls[i];
    const N1 = C.from(metal.n[i], metal.k[i]);
    const { T, R, A } = calculateThinFilm(n0, N1, nSub, thickness, lam);
    results.push({ wavelength: lam, T, R, A });
  }

  return results;
}

// Node.js 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateSpectrum, calculateThinFilm };
}
