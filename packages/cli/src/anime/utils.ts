import { getBgmLink } from '@animepaste/bangumi/utils';

export {
  getBgmId,
  getBgmTitle,
  getBgmDmhy,
  getBgmLink
} from '@animepaste/bangumi/utils';

import { link } from 'kolorist';

export function bangumiLink(bgmId: string) {
  return link(`Bangumi: ${bgmId}`, getBgmLink(bgmId));
}
