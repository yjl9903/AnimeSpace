# :tv: Anime Paste

<p align="center">「 你所热爱的就是你的动画 」</p>

[![CI](https://github.com/XLorPaste/AnimePaste/actions/workflows/ci.yml/badge.svg)](https://github.com/XLorPaste/AnimePaste/actions/workflows/ci.yml)

Paste your favourite anime online.

## Use local admin CLI

First, clone this repo to your machine.

```bash
git clone https://github.com/XLorPaste/AnimePaste.git
```

Second, install dependencies and build locally.

```bash
pnpm install
pnpm build:cli
```

Finally, link the cli binary globally.

```bash
cd packages/cli
pnpm link -g
```

Test installation:

```bash
anime --version
# anime/0.0.0
```

## Deploy Web Application

AnimePaste web application is implemented to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/) and [Functions](https://developers.cloudflare.com/pages/platform/functions/) (Serverless workers).

First, fork this repo, and create a project on the Pages dashboard.

Build command is `npm install -g pnpm && pnpm i && pnpm build:app`, and build output is located at `/packages/app/dist`, and root directory is `/`.

Second, go to Pages settings tab. Set production environment variables:

+ `NODE_VERSION`: `16.7.0`
+ `ENABLE_PUBLIC`: `true` (If you do not want visitors to use your app, you can let it empty or anything else)

Third, go to `Workers`, `KV` tab in the left navbar. Create a new KV namespace for data storage. Then, create a new key-value pair, `user:<token>` maps to `{"token":"<token>","type":"root"}`. Note that this key-value pair is used for authorization, and you should generate a private token to replace `<token>` and **DO NOT** share this token with others.

Finally, go back to the Pages settings, and add a new binding called `anime` for functions production usage.

<p align="center">「 喜欢的话就坚持吧 」</p>

## License

MIT License © 2021 [XLor](https://github.com/yjl9903)
