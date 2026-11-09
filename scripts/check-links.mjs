import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dataFiles = ['src/data/conferences.ts', 'src/data/ratings.ts'].map((file) =>
  resolve(process.cwd(), file),
);
const source = dataFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const urls = [
  ...new Set(
    [...source.matchAll(/https?:\/\/[^'"\s]+/g)]
      .map((match) => match[0].replace(/[),.;]+$/, ''))
      .filter((url) => !url.includes('jicheng.local')),
  ),
].sort();

const results = await Promise.all(
  urls.map(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        },
      });
      return { url, status: response.status, final: response.url };
    } catch (error) {
      return { url, status: 'ERR', final: error instanceof Error ? error.message : String(error) };
    }
  }),
);

for (const result of results) {
  const marker = result.status === 200 ? 'OK ' : '!! ';
  console.log(`${marker}${String(result.status).padEnd(4)} ${result.url}`);
  if (result.final && result.final !== result.url) {
    console.log(`      -> ${result.final}`);
  }
}

const broken = results.filter((result) => result.status === 404 || result.status === 410 || result.status === 'ERR');
console.log(`\n${results.length} URLs checked · ${broken.length} broken/unreachable`);
if (broken.length > 0) process.exitCode = 1;
