import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAnimeSystem, loadSpace } from '@animespace/core';

import { Aria2Client } from '../src/download/aria2';

const root = path.join(
  fileURLToPath(import.meta.url),
  '../../../core/test/fixtures/space'
);
const space = await loadSpace(root);
const system = await createAnimeSystem(space);

const client = new Aria2Client(system, {
  debug: { log: './aria2.log', pipe: false }
});

await client.start();

await client.download(
  '[喵萌Production&LoliHouse] 偶像大师 灰姑娘女孩 U149 / THE IDOLM@STER CINDERELLA GIRLS U149 - 05 [WebRip 1080p HEVC-10bit AAC][简繁日内封字幕]',
  'magnet:?xt=urn:btih:TYQHELYZVAJ5RHVER5VXO36V6XOSPBUO&dn=&tr=http%3A%2F%2F104.143.10.186%3A8000%2Fannounce&tr=udp%3A%2F%2F104.143.10.186%3A8000%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker3.itzmx.com%3A6961%2Fannounce&tr=http%3A%2F%2Ftracker4.itzmx.com%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.publicbt.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker.prq.to%2Fannounce&tr=http%3A%2F%2Fopen.acgtracker.com%3A1096%2Fannounce&tr=https%3A%2F%2Ft-115.rhcloud.com%2Fonly_for_ylbud&tr=http%3A%2F%2Ftracker1.itzmx.com%3A8080%2Fannounce&tr=http%3A%2F%2Ftracker2.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker1.itzmx.com%3A8080%2Fannounce&tr=udp%3A%2F%2Ftracker2.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker3.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker4.itzmx.com%3A2710%2Fannounce&tr=http%3A%2F%2Ftr.bangumi.moe%3A6969%2Fannounce&tr=http%3A%2F%2Ft.nyaatracker.com%2Fannounce&tr=http%3A%2F%2Fopen.nyaatorrents.info%3A6544%2Fannounce&tr=http%3A%2F%2Ft2.popgo.org%3A7456%2Fannonce&tr=http%3A%2F%2Fshare.camoe.cn%3A8080%2Fannounce&tr=http%3A%2F%2Fopentracker.acgnx.se%2Fannounce&tr=http%3A%2F%2Ftracker.acgnx.se%2Fannounce&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=http%3A%2F%2Ft.nyaatracker.com%3A80%2Fannounce&tr=https%3A%2F%2Ftr.bangumi.moe%3A9696%2Fannounce&tr=http%3A%2F%2Ft.acg.rip%3A6699%2Fannounce&tr=http%3A%2F%2Fopen.acgnxtracker.com%2Fannounce&tr=https%3A%2F%2Ftracker.nanoha.org%2Fannounce',
  {
    onStart() {
      system.logger.log('Start downloading');
    },
    onMetadataProgress(payload) {
      system.logger.log(
        `Metadata: ${payload.completed} / ${payload.total}  (Connections: ${payload.connections}, Speed: ${payload.speed})`
      );
    },
    onMetadataComplete() {
      system.logger.log(`Metadata OK`);
    },
    onProgress(payload) {
      system.logger.log(
        `Downloading: ${payload.completed} / ${payload.total}  (Connections: ${payload.connections}, Speed: ${payload.speed})`
      );
    },
    onComplete() {
      system.logger.log('Download OK');
    },
    onError(error) {
      system.logger.error(error.message);
    }
  }
);

await client.close();
