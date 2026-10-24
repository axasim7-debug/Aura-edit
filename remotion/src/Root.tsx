// src/Root.tsx
import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {AuraEdit} from './aura/AuraEdit';
import {BeatsFile, Plan} from './aura/types';

type Props = {plan: Plan; beats: BeatsFile};

// يقرأ public/data/plan.json و beats.json إن لم تُمرَّر عبر --props، ويضبط المدة منهما
const calculateMetadata: CalculateMetadataFunction<Props> = async ({props}) => {
  const plan: Plan = props.plan ?? (await (await fetch(staticFile('data/plan.json'))).json());
  const beats: BeatsFile = props.beats ?? (await (await fetch(staticFile('data/beats.json'))).json());
  return {
    props: {plan, beats},
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
    durationInFrames: Math.ceil(beats.duration * plan.fps),
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AuraEdit"
    component={AuraEdit}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{plan: null as unknown as Plan, beats: null as unknown as BeatsFile}}
    calculateMetadata={calculateMetadata}
  />
);
