// Validates a plan before rendering: every segment's velocity curve must stay inside its source clip.
// Usage: npx tsx scripts/check-plan.ts [public/data/plan.json] [public/data/beats.json]
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildRemap, speedAt} from '../src/aura/velocity';
import type {BeatsFile, Plan} from '../src/aura/types';

const plan: Plan = JSON.parse(readFileSync(process.argv[2] ?? 'public/data/plan.json', 'utf8'));
const beats: BeatsFile = JSON.parse(readFileSync(process.argv[3] ?? 'public/data/beats.json', 'utf8'));
const fps = plan.fps;
const toFrame = (t: number) => Math.round(t * fps);

let ok = true;
let prevEnd = 0;
for (const [i, seg] of plan.segments.entries()) {
  const from = toFrame(seg.start);
  const len = toFrame(seg.end) - from;
  const beatFrames = beats.beats
    .filter((b) => b.t >= seg.start && b.t < seg.end && b.level >= 2)
    .map((b) => toFrame(b.t) - from);
  const curve = seg.velocity ?? 'none';
  const table = buildRemap(len, (f) => speedAt(f, len, curve, seg.slow ?? 0.3, seg.fast ?? 3, beatFrames, seg.speed ?? 1));
  const used = seg.srcStart + table[len] / fps;
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join('public', seg.clip)]).toString());
  const gap = Math.abs(seg.start - prevEnd) > 0.001 ? `  ⚠ gap/overlap ${(seg.start - prevEnd).toFixed(3)}s` : '';
  const status = used <= dur ? 'OK ' : 'OVER';
  if (used > dur || len <= 0) ok = false;
  console.log(`${status} #${i} ${seg.clip.padEnd(24)} ${seg.start.toFixed(2)}-${seg.end.toFixed(2)} ${curve.padEnd(9)} src ${seg.srcStart.toFixed(2)}→${used.toFixed(2)} / ${dur.toFixed(2)}s${gap}`);
  prevEnd = seg.end;
}
if (Math.abs(prevEnd - beats.duration) > 0.05) console.log(`⚠ segments end at ${prevEnd}s but song is ${beats.duration}s`);
process.exit(ok ? 0 : 1);
