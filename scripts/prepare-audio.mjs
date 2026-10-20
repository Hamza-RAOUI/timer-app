/**
 * Turn the Pixabay downloads into the app's ambience files (public/audio/<key>.mp3).
 *
 *   node scripts/prepare-audio.mjs "C:/Users/you/Downloads"
 *
 * Finds each track by its Pixabay id in the file name, then with ffmpeg (must be on PATH):
 *  - ambience: 3 min, mono 64 kbps, loudness-matched, tail cross-faded into the head
 *    so the loop has no seam;
 *  - music: full length, stereo 128 kbps, loudness-matched.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TRACKS = [
  { key: 'brown', id: '299934', kind: 'ambience' },
  { key: 'rain', id: '437305', kind: 'ambience' },
  { key: 'waves', id: '332383', kind: 'ambience' },
  { key: 'night', id: '17862', kind: 'ambience' },
  { key: 'cafe', id: '51695', kind: 'ambience' },
  { key: 'fire', id: '178209', kind: 'ambience' },
  { key: 'lofi1', id: '586095', kind: 'music' },
  { key: 'lofi2', id: '112191', kind: 'music' },
];

const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('Usage: node scripts/prepare-audio.mjs <folder with the downloaded .mp3 files>');
  process.exit(1);
}
const out = join(process.cwd(), 'public', 'audio');
mkdirSync(out, { recursive: true });
const files = readdirSync(src).filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f));

for (const t of TRACKS) {
  const file = files.find((f) => new RegExp(`(^|\\D)${t.id}(\\D|$)`).test(f));
  if (!file) {
    console.log(`– ${t.key}: no file with id ${t.id} in ${src}`);
    continue;
  }
  const input = join(src, file);
  const dest = join(out, `${t.key}.mp3`);
  const args =
    t.kind === 'music'
      ? ['-y', '-v', 'error', '-i', input, '-af', 'loudnorm=I=-18:TP=-1.5', '-ac', '2', '-ar', '44100', '-b:a', '128k', dest]
      : [
          '-y', '-v', 'error', '-i', input,
          '-filter_complex',
          // main = 2s…182s; head = 0…2s cross-faded onto main's end → the end flows into the start.
          '[0]atrim=0:182,asetpts=N/SR/TB,asplit[x][y];[x]atrim=2:182,asetpts=N/SR/TB[main];[y]atrim=0:2,asetpts=N/SR/TB[head];[main][head]acrossfade=d=2,loudnorm=I=-22:TP=-2[o]',
          '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '64k', dest,
        ];
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log(`✓ ${t.key}.mp3 ← ${file} (${Math.round(statSync(dest).size / 1024)} KB)`);
}
