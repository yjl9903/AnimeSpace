import { download as webtorrentDownload } from './webtorrent';

export type DownloadProviders = 'webtorrent' | 'aria2' | 'qbittorrent';

export async function download(
  provider: DownloadProviders,
  magnet: string,
  dist: string,
  options: any
) {
  switch (provider) {
    case 'aria2':
    case 'qbittorrent':
    case 'webtorrent':
    default:
      return webtorrentDownload(magnet, dist);
  }
}
