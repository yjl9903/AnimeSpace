import fs from 'fs-extra';
import * as crypto from 'node:crypto';

import { bold } from '@breadc/color';
import Progress from 'cli-progress';

const { Format, MultiBar, Presets, SingleBar } = Progress;

export function b64encode(text: string) {
  return Buffer.from(text, 'utf-8').toString('base64');
}

export function b64decode(text: string): string {
  return Buffer.from(text, 'base64').toString();
}

export async function hashFile(filepath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function createSingleProgress() {
  return new SingleBar(
    {
      format: '  {bar} {percentage}% | ETA: {eta}s',
      clearOnComplete: true
    },
    Presets.shades_grey
  );
}

export interface ProgressBarOption<T> {
  suffix?: (value: number, total: number, payload: T) => string;
}

export function createProgressBar<T extends object>(
  option: ProgressBarOption<T> = {}
) {
  const multibar = new MultiBar(
    {
      format(_options, params, payload: T & { title: string }) {
        // const formatTime = Format.TimeFormat;
        const formatValue = Format.ValueFormat;
        const formatBar = Format.BarFormat;
        const percentage = Math.floor(params.progress * 100);
        // const stopTime = Date.now();
        // const elapsedTime = Math.round((stopTime - params.startTime) / 1000);

        const context = {
          bar: formatBar(params.progress, _options),

          percentage: formatValue(percentage, _options, 'percentage'),
          total: params.total,
          value: params.value
          // eta: formatValue(params.eta, _options, 'eta'),
          // duration: formatValue(elapsedTime, _options, 'duration'),
        };

        const suffix: string = option.suffix
          ? ' | ' + option.suffix(params.value, params.total, payload)
          : '';

        return payload.title !== undefined && typeof payload.title === 'string'
          ? `  ${payload.title}`
          : `  ${context.bar} ${context.percentage}%` + suffix;
      },
      stopOnComplete: false,
      clearOnComplete: true,
      hideCursor: true,
      forceRedraw: true
    },
    Presets.shades_grey
  );

  multibar.on('stop', () => {
    // @ts-ignore
    for (const line of multibar.loggingBuffer) {
      // Remove the last end of line symbol
      console.log(line.substring(0, line.length - 1));
    }
  });

  return {
    finish() {
      multibar.stop();
    },
    println(text: string) {
      multibar.log(text + '\n');
    },
    create(name: string, length: number) {
      const empty = multibar.create(length, 0, {}, { title: name } as any);
      const title = multibar.create(length, 0, {}, { title: name } as any);
      const progress = multibar.create(length, 0);
      title.update(0, { title: bold(name) });
      empty.update(0, { title: '' });

      return {
        update(value: number, payload?: T) {
          empty.update(value, { title: '' });
          title.update(value, { title: bold(name) });
          progress.update(value, payload);
        },
        increment(value: number, payload?: T) {
          empty.increment(value, { title: '' });
          title.increment(value, { title: bold(name) });
          progress.increment(value, payload);
        }
      };
    }
  };
}
