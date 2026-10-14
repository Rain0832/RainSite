# Rain 的博客

这是 Rain 的个人静态博客，在线地址：

<https://rainsite.icu/>

站点使用 Hugo 和 PaperMod 构建，部署在 Cloudflare Worker Static Assets。博客主要记录：

- **技术**：AI、C++、Go、分布式系统、Web 服务、项目实践和学习笔记
- **生活**：日常日志、旅行见闻和个人思考
- **归档**：按时间顺序查看全部文章
- **主页**：个人介绍和联系方式

## 本地运行

环境要求：

- Hugo Extended `0.140` 或更高版本
- Git

克隆仓库并初始化 PaperMod 子模块：

```bash
git clone https://github.com/Rain0832/RainSite.git
cd RainSite
git submodule update --init --recursive
```

启动本地预览：

```bash
hugo server -D
```

打开 <http://localhost:1313/>。

## 写文章

文章放在 `content/posts/` 目录中。技术文章示例：

```markdown
---
title: "文章标题"
date: 2026-10-14T20:00:00+08:00
tags: ["标签"]
categories: ["技术"]
draft: false
---

文章正文。
```

日常日志使用：

```yaml
categories: ["生活"]
```

文章提交并推送到 `main` 后，Cloudflare 会自动构建和发布。

## 构建与部署

本地构建：

```bash
hugo --minify
```

Cloudflare 使用以下配置：

```text
Build command: hugo --minify
Deploy command: npx wrangler deploy
Root directory: /
```

根目录的 `wrangler.jsonc` 将 Hugo 生成的 `public/` 配置为静态资源目录。不要提交 `public/`、`resources/` 或 `.hugo_build.lock` 等本地构建产物。

## 目录说明

```text
content/posts/       文章
content/about.md     个人主页
content/archives.md 归档页
hugo.toml            Hugo 站点配置和导航
static/images/       网站静态图片和图标
themes/PaperMod/     PaperMod 主题子模块
wrangler.jsonc       Cloudflare Worker 静态资源配置
```

## 内容编辑

个人主页可以直接编辑：

```text
content/about.md
```

站点名称、域名和导航可以编辑：

```text
hugo.toml
```

本项目保持纯静态，不包含 Node 服务、数据库或自建后端。

## 图片组织

普通网站图片放在 `static/images/`，在 Markdown 中使用：

```markdown
![图片说明](/images/example.jpg)
```

建议一篇文章使用一个同名目录，文章和图片放在一起：

```text
content/posts/my-article/
├── index.md
└── image.jpg
```

文章中使用相对路径：

```markdown
![示例图片](image.jpg)
```

创建文章时可以直接复制这个结构。不要把文章图片放在仓库根目录，也不要把构建产物放进 `public/`。

## 手机发布文章

目前最简单的方式是使用 GitHub 手机 App 直接编辑或新建：

```text
content/posts/文章目录/index.md
```

提交到 `main` 后，Cloudflare 会自动构建部署。也可以先在手机笔记应用中写好 Markdown，再粘贴到 GitHub。

如果以后需要更像“后台编辑器”的体验，可以接入 Decap CMS 或其他 Git-based CMS，但那会增加登录、OAuth 和管理后台配置；当前纯静态方案不需要这些复杂度。
