#!/usr/bin/env optc

/// <reference types="optc/globals" />

interface CliOption {
  docs: boolean;
}

export default async function (option: CliOption) {
  if (fs.existsSync('./dist')) {
    await fs.remove('./dist');
  }
  await fs.mkdir('./dist');

  await $`pnpm build:app`;
  await fs.copy('./packages/app/dist', './dist');

  if (option.docs) {
    await $`pnpm build:docs`;
    await fs.mkdir('./dist/docs');
    await fs.copy('./docs/.vitepress/dist', './dist/docs');
  }
}
