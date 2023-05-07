# 安装管理后台 CLI

为了给 AnimeSpace 添加动画资源，你需要使用配套的[管理后台命令行程序](https://github.com/XLorPaste/AnimePaste/tree/main/packages/cli)。

> **环境准备**
>
> 全局安装最新的 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/)。

## 从 npm 上全局安装

```bash
npm i -g animespace
# or
pnpm i -g animespace
```

## 手动安装

首先，克隆本仓库（或者你部署时 fork 的仓库）。

```bash
git clone https://github.com/XLorPaste/AnimePaste.git
```

然后，安装依赖，并构建 CLI。

```bash
pnpm install
pnpm build:cli
```

最后，将 CLI 链接为全局可执行程序。

```bash
cd packages/cli
pnpm link -g
```
