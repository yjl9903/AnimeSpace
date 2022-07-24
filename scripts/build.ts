#!/usr/bin/env optc

/// <reference types="optc/globals" />

export default async function () {
  await $`pnpm build:app`;
  await $`pnpm build:docs`;
  if (fs.existsSync('./dist')) {
    await fs.remove('./dist');
  }
  await fs.mkdir('./dist');
  await fs.mkdir('./dist/docs');
  await fs.copy('./docs/.vitepress/dist', './dist/docs');
  await fs.copy('./packages/app/dist', './dist');
}
