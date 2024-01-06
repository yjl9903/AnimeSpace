import { type Plugin, type PluginEntry } from '@animespace/core';

import prompts from 'prompts';

import { generatePlan, getCollections, searchBgm } from './generate';

export interface BangumiOptions extends PluginEntry {
  username?: string;
}

export function Bangumi(options: BangumiOptions): Plugin {
  return {
    name: 'bangumi',
    options,
    command(system, cli) {
      const logger = system.logger.withTag('bangumi');

      cli
        .command('bangumi search <input>', 'Search anime from bangumi and generate plan')
        .alias('bgm search')
        .option('--date <date>', 'Specify the onair begin date')
        .option('--fansub', 'Generate fansub list')
        .action(async (input, options) => {
          const bgms = await searchBgm(input);
          if (bgms.length === 0) {
            logger.warn('未找到任何动画');
            return;
          }

          const selected =
            bgms.length === 1
              ? { bangumi: bgms }
              : await prompts({
                  type: 'multiselect',
                  name: 'bangumi',
                  message: '选择将要生成计划的动画',
                  choices: bgms.map((bgm) => ({
                    title: (bgm.name_cn || bgm.name) ?? String(bgm.id!),
                    value: bgm
                  })),
                  hint: '- 上下移动, 空格选择, 回车确认',
                  // @ts-ignore
                  instructions: false
                });

          if (!selected.bangumi) {
            return;
          }

          if (bgms.length > 1) {
            logger.log('');
          }

          await generatePlan(
            system,
            selected.bangumi.map((bgm: any) => bgm.id!),
            { create: undefined, fansub: options.fansub, date: options.date }
          );
        });

      cli
        .command('bangumi generate', 'Generate Plan from your bangumi collections')
        .alias('bgm gen')
        .alias('bgm generate')
        .option('--username <username>', 'Bangumi username')
        .option('--create <filename>', 'Create plan file in the space directory')
        .option('--fansub', 'Generate fansub list')
        .option('--date <date>', 'Specify the onair begin date')
        .action(async (options) => {
          const username = options.username ?? '';

          if (!username) {
            logger.error('You should provide your bangumi username with --username <username>');
          }

          const collections = await getCollections(username);
          return await generatePlan(system, collections, options);
        });
    }
  };
}
