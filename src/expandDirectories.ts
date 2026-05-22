import fg from 'fast-glob';
import path from 'path';
import { Logger } from './options/logger';

const GLOB_CHARS_RE = /[*?[{}]/;

function hasGlobChars(s: string): boolean {
  return GLOB_CHARS_RE.test(s);
}

export function expandDirectories(directories: string[], logger: Logger): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const dir of directories) {
    if (hasGlobChars(dir)) {
      const matches = fg.sync(dir, { onlyDirectories: true });
      if (matches.length === 0) {
        logger.warn(`Directory pattern "${dir}" did not match any directories`);
        continue;
      }
      for (const match of matches) {
        const resolved = path.resolve(match);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          result.push(match);
        }
      }
    } else {
      const resolved = path.resolve(dir);
      if (!seen.has(resolved)) {
        seen.add(resolved);
        result.push(dir);
      }
    }
  }

  return result.sort();
}
