// src/aura/looks.ts
export const LOOKS = {
  cold:    {filter: 'contrast(1.25) saturate(0.8) brightness(0.94)', tint: '#0a3a4a', tintOpacity: 0.35},
  villain: {filter: 'contrast(1.35) saturate(0.6) brightness(0.9)',  tint: '#5a0000', tintOpacity: 0.3},
  noir:    {filter: 'grayscale(1) contrast(1.4) brightness(0.95)',  tint: null, tintOpacity: 0},
  golden:  {filter: 'contrast(1.2) saturate(1.05) sepia(0.15)',     tint: '#4a2a00', tintOpacity: 0.25},
  neon:    {filter: 'contrast(1.15) saturate(1.15)',                tint: '#2a0a4a', tintOpacity: 0.3},
  none:    {filter: '', tint: null, tintOpacity: 0},
} as const;
