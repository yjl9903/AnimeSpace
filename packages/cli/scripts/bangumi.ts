#!/usr/bin/env optc

/// <reference types="optc/globals" />

export default async function () {
  const fields = ['titleCN', 'titleTranslate', 'begin', 'dmhy'].join(',');

  await $`bangumi cli-data --fields ${fields}`;
}
