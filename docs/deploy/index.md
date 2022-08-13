# 开始

Anime Paste 核心分为 [前端应用](https://github.com/XLorPaste/AnimePaste/tree/main/packages/app) 和 [管理后台命令行程序](https://github.com/XLorPaste/AnimePaste/tree/main/packages/cli)。

## 部署前端应用

AnimePaste web application is implemented to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/) and [Functions](https://developers.cloudflare.com/pages/platform/functions/) (Serverless workers).

First, fork this repo, and create a project on the Pages dashboard.

Build command is `npm install -g pnpm && pnpm i && pnpm build:app`, and build output is located at `/packages/app/dist`, and root directory is `/`.

Second, go to Pages settings tab. Set production environment variables:

+ `NODE_VERSION`: `16.7.0`
+ `ENABLE_PUBLIC`: `true` (If you do not want visitors to use your app, you can let it empty or anything else)

Third, go to `Workers`, `KV` tab in the left navbar. Create a new KV namespace for data storage. Then, create a new key-value pair, `user:<token>` maps to `{"token":"<token>","type":"root"}`. Note that this key-value pair is used for authorization, and you should generate a private token to replace `<token>` and **DO NOT** share this token with others.

Finally, go back to the Pages settings, and add a new binding called `anime` for functions production usage.
