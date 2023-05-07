# AnimeSpace Core Package

It provides internal abstraction for [AnimeSpace](https://github.com/XLorPaste/AnimePaste).

## Usage

### Plugin Development

```ts
import { type Plugin, type PluginEntry } from '@animespace/core';

export interface CustomPluginOptions extends PluginEntry {}

export function CustromPlugin(options: CustomPluginOptions): Plugin {
  return {
    name: 'CustromPlugin'
  };
}
```

## License

AGPL-3.0 License © 2023 [XLor](https://github.com/yjl9903)
