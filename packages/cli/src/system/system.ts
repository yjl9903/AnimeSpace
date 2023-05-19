import os from 'node:os';
import path from 'node:path';

import { Local } from '@animespace/local';
import { Bangumi } from '@animespace/bangumi';
import { AnimeGarden } from '@animespace/animegarden';
import { createAnimeSystem, loadSpace, PluginLoader } from '@animespace/core';

const pluginLoader: PluginLoader = {
  async animegarden(entry) {
    return AnimeGarden(entry);
  },
  async bangumi(entry) {
    return Bangumi(entry);
  },
  async local(entry) {
    return Local(entry);
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
