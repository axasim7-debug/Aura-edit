import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Beat, BeatsFile, Plan, Segment, SegmentText} from './types';
import {toFrame} from './beat-utils';
import {VelocityClip} from './VelocityClip';
import {Shake} from './Shake';
import {ZoomPunch} from './ZoomPunch';
import {WhiteFlash, flashFilter} from './Flash';
import {RgbSplit} from './RgbSplit';
import {Grain, Vignette, Letterbox} from './Overlays';
import {AuraText} from './AuraText';
import {LOOKS} from './looks';
import {SEGMENT_FILTERS, TransitionType, moveTransform, transitionFx} from './transitions';
import {CaptionBar, Subtitles, Watermark} from './Subtitles';

const INTRO_LOOKS = {
  bw: 'grayscale(1) contrast(1.3) brightness(0.97)',
  muted: 'saturate(0.35) contrast(1.12) brightness(0.9)',
  none: '',
};

const textProps = (t: SegmentText, beats: Beat[], absFrom: number, durFrames: number) => ({
  value: t.value, kind: t.kind, font: t.font, size: t.size, color: t.color, top: t.top,
  stroke: t.stroke, glow: t.glow, spacing: t.spacing, exit: t.exit, dur: durFrames,
  beats: t.beat ? beats : undefined, absFrom,
});

/** لقطة واحدة مع انتقالاتها وحركة الكاميرا والفلتر الخاص بها */
const SegmentLayer: React.FC<{
  seg: Segment; index: number; len: number; inT: TransitionType; outT: TransitionType;
  clipProps: React.ComponentProps<typeof VelocityClip>;
}> = ({seg, index, len, inT, outT, clipProps}) => {
  const f = useCurrentFrame();
  const fx = transitionFx(f, len, inT, outT, `seg${index}`);
  const move = moveTransform(f, len, seg.move ?? 'none', seg.moveAmount ?? 0.12);
  const segFilter = SEGMENT_FILTERS[seg.filter ?? 'none'] ?? '';
  const id = `wb${index}`;
  const filter = [segFilter, fx.filter, fx.blurX > 0.5 ? `url(#${id})` : ''].filter(Boolean).join(' ');
  const y = seg.focusY ? `translateY(${-seg.focusY * 100}%) scale(${1 + Math.abs(seg.focusY) * 2})` : '';
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {fx.blurX > 0.5 && (
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={id} x="-20%" y="0" width="140%" height="100%">
            <feGaussianBlur stdDeviation={`${fx.blurX} 0`} />
          </filter>
        </svg>
      )}
      <AbsoluteFill style={{transform: [fx.transform, move, y].filter(Boolean).join(' ') || undefined, filter: filter || undefined, opacity: fx.opacity}}>
        <VelocityClip {...clipProps} style={seg.mono ? {filter: 'grayscale(1)'} : undefined} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AuraEdit: React.FC<{plan: Plan; beats: BeatsFile}> = ({plan, beats}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const dropF = toFrame(beats.drop, fps);
  const look = LOOKS[plan.look];
  const preDrop = frame < dropF;
  const introLook = INTRO_LOOKS[plan.intro?.look ?? 'bw'];

  const dyn = preDrop ? introLook : look.filter;
  const videoFilter = `${dyn} ${flashFilter(frame, fps, beats.beats)}`.trim();
  // خفض الأغنية أثناء الحوار (ducking) مع انحدار 6 فريمات
  const talking = (fr: number) =>
    plan.segments.some((sg) => sg.dialogue && fr >= toFrame(sg.start, fps) && fr < toFrame(sg.end, fps)) ||
    (plan.voices ?? []).some((v) => fr >= toFrame(v.t + (v.from ?? 0), fps) && fr < toFrame(v.t + v.to, fps));
  let near = 0;
  for (let k = -6; k <= 6; k++) if (talking(frame + k)) near = Math.max(near, 1 - Math.abs(k) / 7);
  const songVol = (plan.songVolume ?? 1) * (1 - near * (1 - (plan.duck ?? 0.3)));
  const fadeIn = plan.intro?.fadeIn ? interpolate(frame, [0, toFrame(plan.intro.fadeIn, fps)], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  return (
    <AbsoluteFill style={{background: 'black'}}>
      <AbsoluteFill style={{opacity: fadeIn}}>
        <Shake beats={beats.beats}>
          <ZoomPunch beats={beats.beats} creepUntil={dropF}>
            <RgbSplit beats={beats.beats} id="rgb">
              <AbsoluteFill style={{filter: videoFilter || undefined}}>
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
                  const inT = (seg.transition ?? 'cut') as TransitionType;
                  const outT = (plan.segments[i + 1]?.transition ?? 'cut') as TransitionType;
                  return (
                    <Sequence key={i} from={from} durationInFrames={len}>
                      <SegmentLayer seg={seg} index={i} len={len} inT={inT} outT={outT} clipProps={clipProps} />
                      {seg.dialogue ? (
                        <Audio src={staticFile(seg.clip)} trimBefore={toFrame(seg.srcStart, fps)} volume={seg.dialogue} />
                      ) : null}
                      {seg.text?.behind && seg.mask && (
                        <>
                          <AuraText {...textProps(seg.text, beats.beats, from, len)} top={seg.text.top ?? '28%'} />
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

        {(plan.letterbox ?? 0.1) > 0 && <Letterbox openAt={dropF} bar={plan.letterbox ?? 0.1} />}
        <Vignette strength={preDrop ? 0.65 : 0.5} />
        <Grain opacity={0.09} />
      </AbsoluteFill>

      {/* النصوص: فوق كل شيء (لا تهتز مع الصورة إلا إن طُلب beat) */}
      {plan.segments.map((seg, i) => {
        if (!seg.text || seg.text.behind) return null;
        const from = toFrame(seg.start + (seg.text.at ?? 0), fps);
        const dur = seg.text.dur !== undefined ? toFrame(seg.text.dur, fps) : toFrame(seg.end, fps) - from;
        return dur > 0 ? (
          <Sequence key={`t${i}`} from={from} durationInFrames={dur}>
            <AuraText {...textProps(seg.text, beats.beats, from, dur)} />
          </Sequence>
        ) : null;
      })}
      {plan.texts?.map((t, i) => {
        const from = toFrame(t.start, fps);
        const dur = t.dur !== undefined ? toFrame(t.dur, fps) : durationInFrames - from;
        return dur > 0 ? (
          <Sequence key={`x${i}`} from={from} durationInFrames={dur}>
            <AuraText {...textProps(t, beats.beats, from, dur)} />
          </Sequence>
        ) : null;
      })}

      <WhiteFlash beats={beats.beats} minLevel={4} />

      <Audio src={staticFile(plan.song)} volume={songVol} />
      {plan.voices?.map((v, i) => (
        <Sequence key={`v${i}`} from={Math.max(0, toFrame(v.t, fps))}>
          <Audio src={staticFile(v.file)} volume={v.volume ?? 1} />
        </Sequence>
      ))}
      {plan.sfx?.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, toFrame(s.t, fps))}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}

      {plan.subtitles && (
        <Subtitles lines={plan.subtitles} font={plan.subtitleStyle?.font} size={plan.subtitleStyle?.size} top={plan.subtitleStyle?.top} />
      )}
      {plan.caption && <CaptionBar text={plan.caption} />}
      {plan.watermark && <Watermark text={plan.watermark} />}
    </AbsoluteFill>
  );
};
