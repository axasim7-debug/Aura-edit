import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Local font files (SIL OFL, from @fontsource) — no network needed while rendering.
export const FONTS = {
  bebas: {family: 'Bebas Neue', file: 'fonts/bebas-neue-latin-400-normal.woff2', weight: '400'},
  anton: {family: 'Anton', file: 'fonts/anton-latin-400-normal.woff2', weight: '400'},
  cinzel: {family: 'Cinzel', file: 'fonts/cinzel-latin-600-normal.woff2', weight: '600'},
  montserrat: {family: 'Montserrat', file: 'fonts/montserrat-latin-500-normal.woff2', weight: '500'},
} as const;

export type FontKey = keyof typeof FONTS;

for (const f of Object.values(FONTS)) {
  loadFont({family: f.family, url: staticFile(f.file), weight: f.weight});
}
