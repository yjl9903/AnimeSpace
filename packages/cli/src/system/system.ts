import os from 'node:os';
import path from 'node:path';

import { Download } from '@animespace/download';
import { AnimeGarden } from '@animespace/animegarden';
import { loadSpace, createAnimeSystem, PluginLoader } from '@animespace/core';

const pluginLoader: PluginLoader = {
  async animegarden(entry) {
    return AnimeGarden(entry);
  },
  async download(entry) {
    return Download(entry);
  }
};

export async function makeSystem(_root?: string) {
  const root = _root ?? inferRoot();
  const space = await loadSpace(root, pluginLoader);
  const system = createAnimeSystem(space);
  return system;
}

export function inferRoot() {
  try {
    const envRoot = process.env.ANIMESPACE_ROOT;
    if (envRoot) {
      return path.resolve(envRoot);
    }
  } finally {
    return path.resolve(os.homedir(), '.animespace');
  }
}
