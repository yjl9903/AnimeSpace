#!/usr/bin/env optc

/// <reference types="optc/globals" />

import { subYears } from 'date-fns';

export default async function () {
  await fs.ensureDir('./data');
  await fs.emptyDir('./data');

  const fields = ['titleCN', 'begin'].join(',');

  await $`node ./cli.mjs data --fields ${fields}`;

  const oneYear = subYears(new Date(), 1);
  await $`node ./cli.mjs recent-data --fields ${fields} --begin ${oneYear.toISOString()}`;
}
