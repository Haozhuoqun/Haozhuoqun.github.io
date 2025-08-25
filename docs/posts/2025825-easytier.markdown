---
layout: post
title:  "基于easytier实现外部访问部署在NAS上的navidrome音乐服务器-以极空间为例"
date:   2025-8-25 8:39:25 -0800
author: VaBi
---

## 动机


长久以来，我依赖使用zerotier这种完全免费且贼简单的工具实现内网穿透，或者叫p2p打洞。这是由于我本身网络技术就是非常average，且不想折腾wireguard，我相信大多数朋友和我类似。但是今年回国后发现zerotier在国内IP之间的实现穿透的成功率并不高，遂寻求解决方案。

## 步骤
### 1. 注册easytier账号
在[easytier web控制台](https://easytier.cn/web#/auth)注册一个账号，<用户名>后面要用到，API主机默认。

### 2. NAS上部署easytier
我使用的NAS是极空间，不需要手动compose，直接在仓库里搜索easytier，选第一个就行，点下载。
![search](docs/imgs/easytierpost/search.png)
然后回本地，选中新下载的镜像，点添加。在通用设置中**一定要勾选特权模式**，如果不选的话后续会出现TUN无法连通的情况，且无法分配主机的虚拟IP。
![add](docs/imgs/easytierpost/add.png)
在网络设置中一定要**把bridge换成host**，否则navidrome的流量无法经过easytier被代理。作为网络小白，我也不清楚为什么bridge模式不行，但是反复试验过后只有换成host这个解决方案。
![net](docs/imgs/easytierpost/net.png)
命令设置页面来定义咱们虚拟网络的信息。我这里由于想使用官方的web控制台，所以是跟着[官方文档](https://easytier.cn/guide/network/web-console.html)这一页写的。
```
-w <注册用的用户名> --machine-id <自己定义一个机器码> --hostname <自己定义一个主机名> -p tcp://public.easytier.cn:11010
```
要注意的是这里不需要密码，以及你可以根据来选择适合的节点主机（或者你自己搭建）。这里我不清楚为什么机器码并没有成功应用，还需要后续debug。
