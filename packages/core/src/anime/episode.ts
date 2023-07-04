import { AnitomyResult, Parser } from 'anitomy';

import type { Anime } from './anime';
import type { FormatOptions } from './types';

export type Episode<T> = TVEpisode<T> | MovieEpisode<T> | SPEpisode<T>;

export interface PartialEpisode<T> {
  anime: Anime;

  title: string;

  metadata: T;

  parsed: AnitomyResult;
}

interface BaseEpisode<T> {
  anime: Anime;

  title: string;

  resolvedTitle: string;

  metadata: T;

  parsed: AnitomyResult;
}

export interface TVEpisode<T> extends BaseEpisode<T> {
  type: 'TV';

  episode: number;

  resolvedEpisode: number;

  episodeAlt?: number;

  resolvedEpisodeAlt?: number;
}

export interface MovieEpisode<T> extends BaseEpisode<T> {
  type: 'MOVIE';
}

export interface SPEpisode<T> extends BaseEpisode<T> {
  type: string;

  episode?: number;

  resolvedEpisode?: number;

  episodeAlt?: number;

  resolvedEpisodeAlt?: number;
}

const parser = new Parser();

export interface ParseEpisodeOptions<T> {
  metadata: T | ((info: AnitomyResult) => T);
}

export function parseEpisode<T = Partial<Omit<FormatOptions, 'episode'>>>(
  anime: Anime,
  title: string,
  options: Partial<ParseEpisodeOptions<T>> = {}
): Episode<T> | PartialEpisode<T> | undefined {
  const info = parser.parse(title);
  if (!info) return undefined;

  const metadata =
    options?.metadata instanceof Function
      ? options.metadata(info)
      : options.metadata ?? undefined;

  if (anime.plan.type === '番剧') {
    const resolvedEpisode = anime.resolveEpisode(info.episode.number);

    if (!!info.type && info.type.toLocaleLowerCase() !== 'tv') {
      // 番剧，有特殊类型，e.g. 番外, 特别篇
      const resolvedTitle = anime.formatFilename({
        ...metadata,
        episode: info.episode.number,
      });

      return <SPEpisode<T>>{
        anime,
        type: info.type,
        title,
        resolvedTitle,
        metadata,
        parsed: info,
        episode: info.episode.number,
        resolvedEpisode,
        // 范围集数
        episodeAlt: info.episode.numberAlt,
        resolvedEpisodeAlt: anime.resolveEpisode(info.episode.numberAlt),
      };
    } else if (
      info.episode.number !== undefined &&
      resolvedEpisode !== undefined
    ) {
      // 番剧，有集数
      const resolvedTitle = anime.formatFilename({
        ...metadata,
        episode: info.episode.number,
      });

      return <TVEpisode<T>>{
        anime,
        type: 'TV',
        title,
        resolvedTitle,
        metadata,
        parsed: info,
        episode: info.episode.number,
        resolvedEpisode,
        // 范围集数, e.g. 01-12
        episodeAlt: info.episode.numberAlt,
        resolvedEpisodeAlt: anime.resolveEpisode(info.episode.numberAlt),
      };
    }
  } else if (anime.plan.type === '电影') {
    // 电影
    const resolvedTitle = anime.formatFilename({
      ...metadata,
      episode: info.episode.number,
    });

    return <MovieEpisode<T>>{
      anime,
      type: 'MOVIE',
      title,
      resolvedTitle,
      metadata,
      parsed: info,
    };
  } else if (anime.plan.type === 'OVA') {
    // 特别篇, 番外篇等
    const resolvedEpisode = anime.resolveEpisode(info.episode.number);
    const resolvedTitle = anime.formatFilename({
      ...metadata,
      episode: info.episode.number,
    });

    return <SPEpisode<T>>{
      anime,
      type: info.type,
      title,
      resolvedTitle,
      metadata,
      parsed: info,
      episode: info.episode.number,
      resolvedEpisode,
      // 范围集数
      episodeAlt: info.episode.numberAlt,
      resolvedEpisodeAlt: anime.resolveEpisode(info.episode.numberAlt),
    };
  }

  return <PartialEpisode<T>>{
    anime,
    title,
    metadata,
    parsed: info,
  };
}

export function isValidEpisode<T>(
  episode: Episode<T> | PartialEpisode<T> | undefined | null
): episode is Episode<T> {
  if (episode && 'type' in episode && episode.type) {
    return true;
  } else {
    return false;
  }
}

export function hasEpisodeNumber<T, E extends Episode<T> = Episode<T>>(
  episode: E
): episode is E & { episode: number; resolvedEpisode: number } {
  return (
    'episode' in episode &&
    episode.episode !== undefined &&
    'resolvedEpisode' in episode &&
    episode.resolvedEpisode !== undefined
  );
}

export function hasEpisodeNumberAlt<T, E extends Episode<T> = Episode<T>>(
  episode: Episode<T>
): episode is E & { episodeAlt: number; resolvedEpisodeAlt: number } {
  return (
    'episodeAlt' in episode &&
    episode.episodeAlt !== undefined &&
    'resolvedEpisodeAlt' in episode &&
    episode.resolvedEpisodeAlt !== undefined
  );
}

export function getEpisodeKey<T>(episode: Episode<T>) {
  const episodeAlt =
    'resolvedEpisodeAlt' in episode
      ? episode.resolvedEpisodeAlt !== undefined
        ? `-${episode.resolvedEpisodeAlt}`
        : ''
      : '';

  if (episode.type === 'TV') {
    return `${episode.type}/${episode.resolvedEpisode ?? 'null'}${episodeAlt}`;
  }
  if (episode.type === 'MOVIE') {
    return `${episode.type}/`;
  }
  if (hasEpisodeNumber(episode)) {
    return `${episode.type}/${episode.resolvedEpisode ?? 'null'}${episodeAlt}`;
  } else {
    return `${episode.type}/`;
  }
}

export function sameEpisode<T>(lhs: Episode<T>, rhs: Episode<T>) {
  return getEpisodeKey(lhs) === getEpisodeKey(rhs);
}
