#!/usr/bin/env optc

/// <reference types="optc/globals" />

export default async function () {
  const fields = ['titleCN', 'titleTranslate', 'begin'].join(',');

  await $`bangumi data --fields ${fields}`;
}
