export interface InfoBox {
  key: string;

  value:
    | string
    | Array<{
        k?: string;
        v: string;
      }>;
}

export interface Images {
  large: string;
  common: string;
  medium: string;
  small: string;
  grid: string;
}

interface Count {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
}

export interface Rating {
  rank: number;
  total: number;
  count: Count;
  score: number;
}

export interface Collection {
  wish: number;
  collect: number;
  doing: number;
  onHold: number;
  dropped: number;
}

export interface Tag {
  name: string;
  count: number;
}

export interface CharacterDetail {
  id: number;
  name: string;
  type: number;
  images: {
    large: string;
    medium: string;
    small: string;
    grid: string;
  };
  summary: string;
  locked: boolean;
  infobox: InfoBox[];
  gender: string;
  blooType: number;
  birthYear: number;
  birthMon: number;
  birthDay: number;
  stat: {
    comments: number;
    collects: number;
  };
}

/**
 * See SubjectSmall in https://bangumi.github.io/api/#model-SubjectSmall
 */
export interface OverviewSubject {
  id: number;
  url: string;
  type: 1 | 2 | 3 | 4 | 6;
  name: string;
  name_cn: string;
  summary: string;
  air_date: string;
  air_weekday: string;
  images: Images;
  eps: number;
  eps_count: number;
  rating: Rating;
  rank: number;
  collection: Collection;
}

/**
 * See Subject in https://bangumi.github.io/api/#model-Subject
 */
export interface Subject {
  id: number;
  type: 1 | 2 | 3 | 4 | 6;
  name: string;
  name_cn: string;
  summary: string;
  nsfw: boolean;
  locked: boolean;
  date: string; // YYYY-MM-DD format
  platform: string;
  images: Images;
  infobox: InfoBox[];
  volumes: number;
  eps: number;
  total_episodes: number;
  rating: Rating;
  collection: Collection;
  tags: Tag[];
}

export interface RawCalendar {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  };
  items: OverviewSubject[];
}
