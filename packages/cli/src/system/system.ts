import os from 'node:os';
import path from 'node:path';

import { loadSpace, createAnimeSystem, PluginLoader } from '@animespace/core';

const pluginLoader: PluginLoader = async (entry) => {
  switch (entry.name) {
    case 'animegarden':
      const { AnimeGarden } = await import('@animespace/animegarden');
      return AnimeGarden(entry);
    case 'donwload':
      const { Download } = await import('@animespace/download');
      return Download(entry);
    default:
      return undefined;
  }
};

export async function makeSystem(_root?: string) {
  const root = _root ?? inferRoot();
  const space = await loadSpace(root, pluginLoader);
  const system = createAnimeSystem(space);
  return system;
}

function inferRoot() {
  try {
    const envRoot = process.env.ANIMEPASTE_SPACE;
    if (envRoot) {
      return path.resolve(envRoot);
    }
  } finally {
    return path.resolve(os.homedir(), '.animepaste');
  }
}
