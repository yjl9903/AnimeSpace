import { debug as createDebug } from 'debug';
import { lightGreen, bold, lightCyan } from 'kolorist';

export const debug = createDebug('anime:daemon');

export const titleColor = bold;
export const startColor = lightCyan;
export const okColor = lightGreen;
