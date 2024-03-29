import Progress from 'cli-progress';
import { bold } from '@breadc/color';

const { Format, MultiBar, Presets, SingleBar } = Progress;

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

export function createProgressBar<T extends Record<string, any>>(
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
          ? `${payload.title}`
          : `${context.bar} ${context.percentage}%` + suffix;
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
      title.update(0, { title: name });
      empty.update(0, { title: '' });

      return {
        stop() {
          empty.stop();
          title.stop();
          progress.stop();
        },
        remove() {
          this.stop();
          multibar.remove(empty);
          multibar.remove(title);
          multibar.remove(progress);
        },
        rename(newName: string) {
          name = newName;
        },
        update(value: number, payload?: T) {
          empty.update(value, { title: '' });
          title.update(value, { title: name });
          progress.update(value, payload);
        },
        increment(value: number, payload?: T) {
          empty.increment(value, { title: '' });
          title.increment(value, { title: name });
          progress.increment(value, payload);
        }
      };
    }
  };
}
