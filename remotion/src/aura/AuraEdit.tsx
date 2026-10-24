// src/aura/AuraEdit.tsx
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {BeatsFile, Plan, SegmentText} from './types';
import {toFrame} from './beat-utils';
import {VelocityClip} from './VelocityClip';
import {Shake} from './Shake';
import {ZoomPunch} from './ZoomPunch';
import {WhiteFlash, flashFilter} from './Flash';
import {RgbSplit} from './RgbSplit';
import {Grain, Vignette, Letterbox} from './Overlays';
import {AuraText} from './AuraText';
import {LOOKS} from './looks';

const textProps = (t: SegmentText) => ({
  value: t.value, kind: t.kind, font: t.font, size: t.size, color: t.color, top: t.top,
});

export const AuraEdit: React.FC<{plan: Plan; beats: BeatsFile}> = ({plan, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dropF = toFrame(beats.drop, fps);
  const look = LOOKS[plan.look];
  const preDrop = frame < dropF;

  // قبل الدروب: أبيض وأسود + مظلم. بعده: الـ look الكامل.
  const dyn = preDrop ? 'grayscale(1) contrast(1.3) brightness(0.97)' : look.filter;
  const videoFilter = `${dyn} ${flashFilter(frame, fps, beats.beats)}`.trim();

  return (
    <AbsoluteFill style={{background: 'black'}}>
      <Shake beats={beats.beats}>
        <ZoomPunch beats={beats.beats} creepUntil={dropF}>
          <RgbSplit beats={beats.beats} id="rgb">
            <AbsoluteFill style={{filter: videoFilter}}>
              {plan.segments.map((seg, i) => {
                const from = toFrame(seg.start, fps);
                const len = toFrame(seg.end, fps) - from;
                if (len <= 0) return null; // Sequence يرفض مدة ≤ 0
                const beatFrames = beats.beats
                  .filter((b) => b.t >= seg.start && b.t < seg.end && b.level >= 2)
                  .map((b) => toFrame(b.t, fps) - from);
                const clipProps = {
                  src: seg.clip, len, srcStartFrame: toFrame(seg.srcStart, fps),
                  curve: seg.velocity ?? 'none', slow: seg.slow ?? 0.3, fast: seg.fast ?? 3,
                  constant: seg.speed ?? 1, beatFrames,
                };
                return (
                  <Sequence key={i} from={from} durationInFrames={len}>
                    <VelocityClip {...clipProps} style={seg.mono ? {filter: 'grayscale(1)'} : undefined} />
                    {seg.text?.behind && seg.mask && (
                      <>
                        <AuraText {...textProps(seg.text)} top={seg.text.top ?? '28%'} />
                        <VelocityClip {...clipProps} src={seg.mask} transparent />
                      </>
                    )}
                  </Sequence>
                );
              })}
            </AbsoluteFill>
            {look.tint && !preDrop && (
              <AbsoluteFill style={{background: look.tint, mixBlendMode: 'soft-light', opacity: look.tintOpacity}} />
            )}
          </RgbSplit>
        </ZoomPunch>
      </Shake>

      {/* النصوص غير المحجوبة — فوق الاهتزاز أو داخله حسب الذوق */}
      {plan.segments.map((seg, i) => {
        if (!seg.text || seg.text.behind) return null;
        const from = toFrame(seg.start + (seg.text.at ?? 0), fps);
        const dur = seg.text.dur !== undefined ? toFrame(seg.text.dur, fps) : toFrame(seg.end, fps) - from;
        return dur > 0 ? (
          <Sequence key={`t${i}`} from={from} durationInFrames={dur}>
            <AuraText {...textProps(seg.text)} />
          </Sequence>
        ) : null;
      })}

      {(plan.letterbox ?? 0.1) > 0 && <Letterbox openAt={dropF} bar={plan.letterbox ?? 0.1} />}
      <Vignette strength={preDrop ? 0.65 : 0.5} />
      <Grain opacity={0.09} />
      <WhiteFlash beats={beats.beats} minLevel={4} />

      <Audio src={staticFile(plan.song)} />
      {plan.sfx?.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, toFrame(s.t, fps))}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}

      {plan.watermark && (
        <div style={{position: 'absolute', top: 120, left: 60, color: 'white', opacity: 0.5, fontSize: 34}}>
          {plan.watermark}
        </div>
      )}
    </AbsoluteFill>
  );
};
