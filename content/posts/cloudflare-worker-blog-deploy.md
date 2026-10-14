---
title: "从域名到上线：我把 Hugo 博客挂到了自己的域名（附 7 个坑）"
date: 2026-10-14
tags: ["Hugo", "Cloudflare", "建站", "踩坑记录"]
categories: ["技术"]
draft: false
---

## 先说结果

我的站点已经上线：**https://rainsite.icu/**

这次的链路是：Hugo 生成静态页，Cloudflare Worker 托管，阿里云买的域名改 NS 接入 Cloudflare，最后全站 HTTPS。真正从域名到能打开，中间踩了 7 个坑，基本每个都卡住了一阵。这篇记录我实际做过的流程。

## 我用的是什么

- 域名：阿里云买的 `rainsite.icu`
- 托管和代理：Cloudflare 账户，Free 计划够用
- 静态站：Hugo + PaperMod 主题，本地构建后把产物传到 Cloudflare Worker
- 工作流：VSCode + GitHub Copilot 写代码和配置，Doubao AI 浏览器负责在 Cloudflare 控制台里操作

一句话分工：**代码交给 Copilot，控制台交给 Doubao，我负责验证和拍板。**

## 完整流程

1. **买域名**：我在阿里云注册了 `rainsite.icu`。
2. **接入 Cloudflare**：Add a site，把域名 NS 改成 Cloudflare 给的两条 NS，等待托管生效。
3. **准备博客资源**：本地用 Hugo 生成静态页面，打包上传到 Cloudflare Worker。
4. **配 Worker 路由**：进入 Workers & Pages → Routes，添加 `rainsite.icu/*`，指向目标 Worker。
5. **加 DNS 记录**：在 DNS 页添加根域名 A 记录：Type 为 `A`、Name 为 `@`、IPv4 为 `192.0.2.1`（占位 IP），代理状态设为 Proxied（橙色云）。

![Cloudflare DNS 记录页](/images/image.png)

6. **SSL/TLS**：模式设为 `Full`，打开 **Always Use HTTPS**。
7. **（可选）加 www**：给 `www` 加一条 CNAME，指向 `rainsite.icu`，代理同样打开。
8. **验证解析**：运行 `nslookup rainsite.icu 223.5.5.5`，确认解析到 Cloudflare 边缘 IP。
9. **连通性测试**：运行 `curl -I https://rainsite.icu/`，返回 200 才算通。
10. **浏览器验证**：用无痕窗口打开，确认站点正常。
11. **修源码链接**：把 Hugo 的 `baseURL` 改成 `https://rainsite.icu/`，重新构建部署，页面内原来的 `xxx.pages.dev` 链接才会换成新域名。

## 我踩的 7 个坑

### 1. 只配了 Worker Route，没加 DNS 占位记录

Route 只负责 HTTP 请求转发，**不负责 DNS 解析**。没有 A 记录，域名根本解析不出来，`curl` 直接报 `curl: (6) Could not resolve host`。Worker 挂根域名，必须补一条 `192.0.2.1` 的占位 A 记录并开代理。

### 2. DNS 解析正常，浏览器打不开，但 curl 正常

`curl` 默认不走 Windows 系统代理，Chrome 会走系统代理或 VPN。代理一异常就是 `ERR_CONNECTION_CLOSED`。校园网还有 IPv6 链路不稳定的加成，所以我优先用 IPv4 测。

### 3. 页面里的链接还是旧的 pages.dev

**域名绑成功不等于页面内链接自动替换。** 必须改 Hugo 的 `baseURL`，重新 build 再部署，才会出现新域名。

### 4. DNS 缓存延迟

改 NS、加记录之后，全球递归 DNS 有 TTL 缓存，几分钟到几小时不等，不可能立刻全网生效。本机记得运行 `ipconfig /flushdns`。

### 5. SSL 模式选错

**别用 Flexible。** Flexible 会有后端证书问题，Worker 场景用 `Full`。

### 6. 代理状态选成了 DNS-only（灰色云）

灰色云会绕过 Cloudflare 代理，流量直接去访问占位 IP `192.0.2.1`，必然打不开。必须是橙色 Proxied。

### 7. 校园网环境的特殊限制

校园网对 IPv6、TLS 握手、443 端口有限制，会出现“解析正常但浏览器连接中断”。别急着怀疑配置，先换 IPv4 或换网络验证。

## 最终状态

- 域名 `rainsite.icu` 托管在 Cloudflare NS
- DNS 占位 A 记录配好，解析正常
- Worker 路由 `rainsite.icu/*` 转发正常
- SSL/TLS = Full，强制 HTTPS
- `curl` HTTPS 返回 200，内容正常
- 无痕窗口可以正常访问

## 下一步

- 加 Giscus 评论（走 GitHub Issues，零后端）
- 加浏览量统计（Cloudflare Web Analytics）
- 继续发文章，补充之前的经历。截止目前，这是本站第一篇文章，后续发文可能会补充之前发生过的事情；换句话说，博客发布时间大概率是事件发生时间，而不是撰写时间。
