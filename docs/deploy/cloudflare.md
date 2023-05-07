# 部署 Cloudflare Pages

AnimePaste Web 应用是基于 [Cloudflare Pages](https://pages.cloudflare.com/) 和 [Functions](https://developers.cloudflare.com/pages/platform/functions/) (Serverless workers) 实现。

> **准备**
>
> 你需要注册好 [GitHub](https://github.com/) 和 [Cloudflare](https://dash.cloudflare.com/) 账号。

首先，fork AnimePaste 的 [仓库](https://github.com/XLorPaste/AnimePaste) 并且在 Cloudflare Pages 面板上创建新项目（选择：连接到 Git），选择刚才 fork 的新仓库。

然后，设置构建命令是 `npm install -g pnpm && pnpm i && pnpm build:app`，构建输出目录是 `/packages/app/dist`。并且设置环境变量：

+ `NODE_VERSION`: `16.7.0`
+ `ENABLE_PUBLIC`: `true` (如果你不希望匿名访客直接进入网站，你可以省略此选项)

![cloudflare](/cloudflare.png)

设置内容如上图所示，点击保存并部署。

接着，前往 Cloudflare 面板左侧导航栏的 `Workers` -> `KV` 面板，创建一个新的命名空间用于 Web 应用的数据存储。在此命名空间内，创建一条新的键值对，键是 `user:<token>`，值是 `{"token":"<token>","type":"root"}`。 注意，这条键值对用于验证网站根管理员账户，你需要自己生成一个密钥字符串，替换键值对中的 `<token>`，并且注意**不要泄露**这条密钥字符串。最后，回到刚才创建的 Pages 项目，在 设置 -> 函数 页面内，添加一个命名空间绑定，变量名称为 `anime`, KV 命名空间为刚才创建的那一个（已经添加过密钥字符串）。

最后，前往你配置 Pages 页面，输入你刚刚生成密钥字符串登录，Web 应用部署完成。

![AnimeSpace](/animepaste.png)
