import fs from 'node:fs';
import path from 'node:path';

export interface Version {
  // Matches the version folder name, which the search API uses as a tag.
  value: string;
  name: string;
}

const dir = path.join(process.cwd(), 'content/docs');

const readMeta = (...segments: string[]) =>
  JSON.parse(fs.readFileSync(path.join(dir, ...segments, 'meta.json'), 'utf8'));

export const versions: Version[] = readMeta().pages.map((value: string) => ({
  value,
  name: readMeta(value).title,
}));
