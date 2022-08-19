import type { CloudflareResponseBody } from 'vite-plugin-cloudflare-functions/worker';

import 'vite-plugin-cloudflare-functions/client';

declare module 'vite-plugin-cloudflare-functions/client' {
  interface PagesResponseBody {
    '/api/play': {
      GET: CloudflareResponseBody<typeof import('../../functions/api/play')['onRequestGet']>;
    };
    '/api/**': {
      ALL: CloudflareResponseBody<typeof import('../../functions/api/_middleware')['onRequest']>;
    };
    '/api/anime/:bgmId': {
      GET: CloudflareResponseBody<typeof import('../../functions/api/anime/[bgmId]')['onRequestGet']>;
    };
    '/api/admin/anime': {
      GET: CloudflareResponseBody<typeof import('../../functions/api/admin/anime')['onRequestGet']>;
      POST: CloudflareResponseBody<typeof import('../../functions/api/admin/anime')['onRequestPost']>;
    };
    '/api/admin/token': {
      POST: CloudflareResponseBody<typeof import('../../functions/api/admin/token')['onRequestPost']>;
      GET: CloudflareResponseBody<typeof import('../../functions/api/admin/token')['onRequestGet']>;
      DELETE: CloudflareResponseBody<typeof import('../../functions/api/admin/token')['onRequestDelete']>;
    };
    '/api/user/sync': {
      GET: CloudflareResponseBody<typeof import('../../functions/api/user/sync')['onRequestGet']>;
      POST: CloudflareResponseBody<typeof import('../../functions/api/user/sync')['onRequestPost']>;
    };
  }
}
