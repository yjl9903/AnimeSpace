# Bangumi Client

## Installation

```bash
npm i bgmc
```

## Usage

Create the bangumi API client, and fetch something.

```ts
import { BgmClient } from 'bgmc';

const client = new BgmClient(fetch);
const calendar = await client.calendar();

console.log(calendar);
```

Get the lastest bangumi data from the cdn of [bgmd](https://unpkg.com/bgmd@0/data/index.json).

```ts
import { getCalendar } from 'bgmc/data';

const calendar = await getCalendar();
console.log(calendar);
```
