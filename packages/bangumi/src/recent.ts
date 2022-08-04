import { load } from './core/load';

export * from './core/types';

const data = load('recent-data.json');

export const bangumis = data.bangumis;
