# 安装管理后台 CLI

为了给 AnimeSpace 添加动画资源，你需要使用配套的[管理后台命令行程序](https://github.com/yjl9903/AnimeSpace/tree/main/packages/cli)。

> **环境准备**
>
> 全局安装最新的 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/)。

## 从 npm 上全局安装

```bash
npm i -g animespace
# or
pnpm i -g animespace
```

## 手动安装和链接

首先，克隆本仓库（或者你部署时 fork 的仓库）。

```bash
git clone https://github.com/yjl9903/AnimeSpace.git
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

## 检验安装成功

如果下载和安装成功, `anime` 命令将被注册到全局，你可以运行以下命令，确认下载的 AnimeSpace CLI 的版本号。

```bash
anime --version
```
