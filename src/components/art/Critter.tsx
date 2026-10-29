import React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import type { FamilyKey, Stage } from '../../lib/rpg';

/**
 * The evolving Flowglass creature: painted art, one image per family × stage
 * (Grain → Pebble → Rock → Monolith), plus the Timekeeper — the mascot, shared by
 * every family at stage 5. Sources: `assets/images/creatures/` (cut from the
 * owner's sheets; prompts in docs/art-prompts.md).
 */
export const FAMILY_ACCENT: Record<FamilyKey, { main: string; dark: string }> = {
  scholar: { main: '#6C7BFF', dark: '#3F4BC9' },
  builder: { main: '#FF9F43', dark: '#D9701A' },
  creator: { main: '#FF5FA2', dark: '#D63A7E' },
  wanderer: { main: '#2EC4B6', dark: '#16958A' },
};

const ART: Record<FamilyKey, Record<Exclude<Stage, 5>, ImageSourcePropType>> = {
  scholar: {
    1: require('../../../assets/images/creatures/scholar-1.webp'),
    2: require('../../../assets/images/creatures/scholar-2.webp'),
    3: require('../../../assets/images/creatures/scholar-3.webp'),
    4: require('../../../assets/images/creatures/scholar-4.webp'),
  },
  builder: {
    1: require('../../../assets/images/creatures/builder-1.webp'),
    2: require('../../../assets/images/creatures/builder-2.webp'),
    3: require('../../../assets/images/creatures/builder-3.webp'),
    4: require('../../../assets/images/creatures/builder-4.webp'),
  },
  creator: {
    1: require('../../../assets/images/creatures/creator-1.webp'),
    2: require('../../../assets/images/creatures/creator-2.webp'),
    3: require('../../../assets/images/creatures/creator-3.webp'),
    4: require('../../../assets/images/creatures/creator-4.webp'),
  },
  wanderer: {
    1: require('../../../assets/images/creatures/wanderer-1.webp'),
    2: require('../../../assets/images/creatures/wanderer-2.webp'),
    3: require('../../../assets/images/creatures/wanderer-3.webp'),
    4: require('../../../assets/images/creatures/wanderer-4.webp'),
  },
};
const TIMEKEEPER: ImageSourcePropType = require('../../../assets/images/creatures/timekeeper.webp');

interface CritterProps {
  family: FamilyKey;
  stage: Stage;
  size: number;
  /** Easter egg: the Rock and Monolith tilt back, smug. */
  browRaise?: boolean;
  /** Draw as a dark silhouette (locked stages). */
  silhouette?: boolean;
}

export const Critter: React.FC<CritterProps> = ({ family, stage, size, browRaise = false, silhouette = false }) => (
  <Image
    source={stage === 5 ? TIMEKEEPER : ART[family][stage]}
    resizeMode="contain"
    accessibilityIgnoresInvertColors
    importantForAccessibility="no"
    tintColor={silhouette ? '#2A2540' : undefined}
    style={[
      { width: size, height: size },
      silhouette && { opacity: 0.85 },
      browRaise && { transform: [{ rotate: '-7deg' }, { scale: 1.06 }] },
    ]}
  />
);
