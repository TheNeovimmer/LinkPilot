import { z } from 'zod';

/** URL field that tolerates "linkedin.com/in/x" and normalizes to https://. */
export const urlField = z
  .string()
  .trim()
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .pipe(z.string().url())
  .optional()
  .or(z.literal('').transform(() => undefined));

/** Same, but nullable (used by profile). */
export const urlFieldNullable = z
  .string()
  .trim()
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .pipe(z.string().url())
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));
