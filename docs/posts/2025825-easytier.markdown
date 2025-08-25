---
layout: post
title:  "基于easytier实现外部访问部署在NAS上的navidrome音乐服务器-以极空间为例"
date:   2025-8-25 8:39:25 -0800
author: VaBi
---

## 动机

长久以来，我依赖使用zerotier这种完全免费且贼简单的工具实现内网穿透，或者叫p2p打洞。这是由于我本身网络技术就是非常average，无物理独立IP且不想折腾wireguard，我相信大多数朋友和我类似。但是今年回国后发现zerotier在国内IP之间的实现穿透的成功率并不高，遂寻求解决方案。

## 配置 Easytier
### 1. 注册easytier账号
在[easytier web控制台](https://easytier.cn/web#/auth)注册一个账号，<用户名>后面要用到，API主机默认。

### 2. NAS上部署easytier
我使用的NAS是极空间，不需要手动compose，直接在仓库里搜索easytier，选第一个就行，点下载。
![search](/imgs/easytierpost/search.png)
然后回本地，选中新下载的镜像，点添加。在通用设置中**一定要勾选特权模式**，如果不选的话后续会出现TUN无法连通的情况，且无法分配主机的虚拟IP。

![add](/imgs/easytierpost/add.png)
在网络设置中一定要**把bridge换成host**，否则navidrome的流量无法经过easytier被代理。作为网络小白，我也不清楚为什么bridge模式不行，但是反复试验过后只有换成host这个解决方案。

![net](/imgs/easytierpost/net.png)
命令设置页面来定义咱们虚拟网络的信息。我这里由于想使用官方的web控制台，所以是跟着[官方文档](https://easytier.cn/guide/network/web-console.html)这一页写的。
```
-w <注册用的用户名> --machine-id <自己定义一个机器码> --hostname <自己定义一个主机名> -p tcp://public.easytier.cn:11010
```
要注意的是这里不需要密码，以及你可以根据来选择适合的节点主机（或者你自己搭建）。这里我不清楚为什么机器码并没有成功应用，还需要后续debug。

现在检查一下[web控制台](https://easytier.cn/web#)看账号下有没有设备已经连接。如下图所示，可以打开显示详情。
![console](/imgs/easytierpost/console.png)

然后创建一个网络，没啥好说的，自己想个<网络名称>，<密码>即可，这和你的登陆密码账户啥的没关系，创建好了选择网络运行就好了，成功的话如图所示，这里我还添加了其他设备到这个网络中所以显示设备比较多。

![console](/imgs/easytierpost/console2.png)
### 3. 其他客户端安装easytier
我是macos + android用户，直接去[下载页面](https://easytier.cn/guide/download.html)找就行了。mac的话需要接触gatekeeper的隔离：
```
xattr -r -d com.apple.quarantine /Applications/easytier-gui.app
```
装好之后也是创建网络，然后用之前的<网络名称>，<密码>即可，运行后应该就能看到这个设备加入网络了。到这一步，检查一下是否能ping通虚拟网络中的设备。

## 配置 Navidrome
### NAS端
首先把你的音乐存到NAS上（废话），然后一样在极空间的docker里搜索navidrome，我用的是deluan/navidrome。虽然咱们不用compose yml配置文件的方法安装，但是可以了解一下各个参数，详见[Navidrome Installing with Docker](https://www.navidrome.org/docs/installation/docker/)。安装好添加镜像，如下图设置文件夹路径，要选择你的音乐文件所在的目录作为/music挂载路径。
![navi1](/imgs/easytierpost/navi1.png)

网络模式选为bridge。端口这里，本地端口指的是外界访问navidome用到的端口，我随便选了一个，只是和默认的容器端口4533作区分，如图。其他就没什么了，运行就完了。
![navi2](/imgs/easytierpost/navi2.png)

完成后首先测试一下本地是否能访问navidrome服务。极空间的这个‘远程访问’功能这里就特别好用，即使你现在就不和NAS在一个‘真’局域网中（就是一个路由器/交换机下的子网，原谅一下我的外行表达），也可以通过极空间自己的外部访问技术访问NAS上的服务。应该能看到navidrome启动了，就是这个丑不垃圾的界面，如图。
![navi-nas](/imgs/easytierpost/navi-nas.png)
![navilogin](/imgs/easytierpost/navilogin.png)

然后就可以快乐寻找你喜欢的navidrome/subsonic客户端了，详见[navidrome 客户端](https://www.navidrome.org/docs/overview/)。我暂时macos使用Feishin，windows使用Supersonic，andriod使用Symfonium（一次性收费，但真的很好），ios使用Amperfy（但我不常用ios）。

## 结语和展望
![feishin](/imgs/easytierpost/feishin.png)
![sym](/imgs/easytierpost/sym.jpg)
完成之后体验只能说绝，easytier的穿透能力比在国外用zerotier还强，p2p连接又快又稳。现在还不清楚
1. DHCP方法设置IP是否长期有效，即是否后续需要调整连接navidrome服务器的地址。
2. NAS上easytier的machineid没有起作用会不会有影响。
3. easytier是否会长期维护，有没有安全隐患。


