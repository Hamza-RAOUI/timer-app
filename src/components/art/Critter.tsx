import React, { useEffect, useState } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { FamilyKey, Stage } from '../../lib/rpg';

/**
 * The evolving Flowglass creature — original vector art, one component for every
 * family × stage so each line reads as the *same* creature growing up:
 * Grain → Pebble → Rock → Monolith → Flowkeeper (the mascot, shared by all families).
 * Family accessories: Scholar (glasses, book, cap, runes), Builder (hard hat, hammer,
 * plates), Creator (beret, brush, notes), Wanderer (scarf, staff, lantern, cloak).
 */
export const FAMILY_ACCENT: Record<FamilyKey, { main: string; dark: string }> = {
  scholar: { main: '#6C7BFF', dark: '#3F4BC9' },
  builder: { main: '#FF9F43', dark: '#D9701A' },
  creator: { main: '#FF5FA2', dark: '#D63A7E' },
  wanderer: { main: '#2EC4B6', dark: '#16958A' },
};

const BODY: Record<Exclude<Stage, 5>, { fill: string; shade: string; light: string }> = {
  1: { fill: '#F6B740', shade: '#DE9524', light: '#FFDB8F' },
  2: { fill: '#CDBB9F', shade: '#A99579', light: '#E9DCC6' },
  3: { fill: '#8F9BB3', shade: '#6C7791', light: '#BAC4D8' },
  4: { fill: '#4D4660', shade: '#342F44', light: '#6E6686' },
};
const GOLD = '#F2C14E';
const INK = '#1B1730';

/** Where things go on each body (viewBox 200×200, ground at y≈182). */
const ANCHOR: Record<Exclude<Stage, 5>, { top: number; eyeY: number; eyeDx: number; eyeR: number; hand: [number, number]; s: number }> = {
  1: { top: 84, eyeY: 146, eyeDx: 13, eyeR: 7, hand: [134, 160], s: 0.72 },
  2: { top: 108, eyeY: 142, eyeDx: 17, eyeR: 8, hand: [150, 158], s: 0.86 },
  3: { top: 82, eyeY: 128, eyeDx: 20, eyeR: 9, hand: [160, 148], s: 1 },
  4: { top: 50, eyeY: 96, eyeDx: 22, eyeR: 8, hand: [166, 138], s: 1.12 },
};

interface CritterProps {
  family: FamilyKey;
  stage: Stage;
  size: number;
  /** Easter egg: one eyebrow shoots up (Rock and Monolith have brows). */
  browRaise?: boolean;
  /** Blink every few seconds (off for reduced motion / static thumbnails). */
  blink?: boolean;
  /** Draw as a dark silhouette (locked stages). */
  silhouette?: boolean;
}

export const Critter: React.FC<CritterProps> = ({ family, stage, size, browRaise = false, blink = true, silhouette = false }) => {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!blink || silhouette) return;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setClosed(true);
      t2 = setTimeout(() => setClosed(false), 140);
    }, 3800 + Math.round(Math.random() * 1800));
    return () => {
      clearInterval(id);
      if (t2) clearTimeout(t2);
    };
  }, [blink, silhouette]);

  const uid = `${family}${stage}${silhouette ? 's' : ''}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`glow${uid}`} cx="50%" cy="55%" r="50%">
          <Stop offset="0" stopColor={stage === 5 ? GOLD : FAMILY_ACCENT[family].main} stopOpacity={silhouette ? 0 : 0.35} />
          <Stop offset="1" stopColor={FAMILY_ACCENT[family].main} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`hood${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E3786" />
          <Stop offset="1" stopColor="#161A45" />
        </LinearGradient>
      </Defs>
      <Circle cx={100} cy={118} r={92} fill={`url(#glow${uid})`} />
      <Ellipse cx={100} cy={184} rx={stage === 5 ? 54 : 30 + stage * 8} ry={7} fill="#000" opacity={0.18} />
      <G opacity={silhouette ? 0.9 : 1}>
        {stage === 5 ? (
          <Flowkeeper uid={uid} closed={closed} silhouette={silhouette} />
        ) : (
          <Creature family={family} stage={stage} closed={closed} browRaise={browRaise} silhouette={silhouette} />
        )}
      </G>
    </Svg>
  );
};

// ───────────── Stages 1–4 ─────────────
const Creature: React.FC<{ family: FamilyKey; stage: Exclude<Stage, 5>; closed: boolean; browRaise: boolean; silhouette: boolean }> = ({ family, stage, closed, browRaise, silhouette }) => {
  const c = silhouette ? { fill: '#2A2540', shade: '#2A2540', light: '#2A2540' } : BODY[stage];
  const a = ANCHOR[stage];
  const acc = FAMILY_ACCENT[family];
  return (
    <G>
      {/* back accessories (cloak, runes) */}
      {!silhouette && <Behind family={family} stage={stage} acc={acc} />}
      <Body stage={stage} c={c} />
      {!silhouette && (
        <>
          <Face stage={stage} a={a} closed={closed} browRaise={browRaise} />
          <Front family={family} stage={stage} a={a} acc={acc} />
        </>
      )}
    </G>
  );
};

const Body: React.FC<{ stage: Exclude<Stage, 5>; c: { fill: string; shade: string; light: string } }> = ({ stage, c }) => {
  if (stage === 1)
    return (
      <G>
        <Ellipse cx={86} cy={180} rx={9} ry={5} fill={c.shade} />
        <Ellipse cx={114} cy={180} rx={9} ry={5} fill={c.shade} />
        <Path d="M100 84 C120 106 136 128 136 150 C136 170 120 182 100 182 C80 182 64 170 64 150 C64 128 80 106 100 84 Z" fill={c.fill} />
        <Path d="M100 84 C120 106 136 128 136 150 C136 170 120 182 100 182 C112 172 118 158 116 142 C114 122 106 104 100 84 Z" fill={c.shade} opacity={0.55} />
        <Ellipse cx={84} cy={124} rx={6} ry={10} fill={c.light} opacity={0.8} transform="rotate(20 84 124)" />
      </G>
    );
  if (stage === 2)
    return (
      <G>
        <Ellipse cx={80} cy={180} rx={11} ry={6} fill={c.shade} />
        <Ellipse cx={120} cy={180} rx={11} ry={6} fill={c.shade} />
        <Path d="M54 150 C52 122 74 106 100 106 C128 106 150 120 148 150 C147 172 128 182 100 182 C72 182 55 172 54 150 Z" fill={c.fill} />
        <Path d="M148 150 C147 172 128 182 100 182 C124 172 134 158 132 136 C131 124 126 114 118 108 C136 112 149 126 148 150 Z" fill={c.shade} opacity={0.6} />
        <Ellipse cx={76} cy={128} rx={9} ry={6} fill={c.light} opacity={0.75} transform="rotate(-25 76 128)" />
        {/* sprout */}
        <Path d="M100 106 C99 98 100 92 104 88" stroke="#6FBF5A" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Ellipse cx={108} cy={88} rx={6} ry={3.5} fill="#7FD06A" transform="rotate(-30 108 88)" />
      </G>
    );
  if (stage === 3)
    return (
      <G>
        {/* arms */}
        <Polygon points="44,128 58,118 66,150 50,158" fill={c.shade} />
        <Polygon points="156,118 168,126 158,152 146,146" fill={c.shade} />
        <Rect x={72} y={168} width={20} height={14} rx={4} fill={c.shade} />
        <Rect x={108} y={168} width={20} height={14} rx={4} fill={c.shade} />
        <Polygon points="62,104 88,84 126,86 148,108 152,150 132,174 70,174 50,148" fill={c.fill} />
        <Polygon points="126,86 148,108 152,150 132,174 112,174 128,140 124,104" fill={c.shade} opacity={0.6} />
        <Polygon points="62,104 88,84 98,92 72,112" fill={c.light} opacity={0.7} />
        {/* crystals */}
        <Polygon points="96,86 104,62 112,86" fill="#5EEAD4" />
        <Polygon points="112,88 124,70 126,92" fill="#2CB9A6" />
        <Polygon points="100,86 104,66 106,86" fill="#B6FFF3" opacity={0.8} />
      </G>
    );
  return (
    <G>
      {/* shoulders + arms */}
      <Circle cx={46} cy={92} r={20} fill={c.shade} />
      <Circle cx={154} cy={92} r={20} fill={c.shade} />
      <Rect x={30} y={98} width={26} height={54} rx={10} fill={c.fill} />
      <Rect x={144} y={98} width={26} height={54} rx={10} fill={c.fill} />
      <Rect x={70} y={164} width={24} height={18} rx={5} fill={c.shade} />
      <Rect x={106} y={164} width={24} height={18} rx={5} fill={c.shade} />
      <Path d="M58 70 C58 56 72 50 100 50 C128 50 142 56 142 70 L144 156 C144 166 136 170 126 170 L74 170 C64 170 56 166 56 156 Z" fill={c.fill} />
      <Path d="M142 70 L144 156 C144 166 136 170 126 170 L112 170 C126 150 128 110 122 54 C134 56 142 60 142 70 Z" fill={c.shade} opacity={0.6} />
      <Rect x={66} y={58} width={22} height={8} rx={4} fill={c.light} opacity={0.6} />
      {/* glowing sand cracks */}
      <Path d="M76 120 L88 134 L82 148 M124 116 L114 130 L122 146 M100 140 L100 160" stroke={GOLD} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.95} />
      <Circle cx={100} cy={124} r={7} fill={GOLD} opacity={0.9} />
      <Circle cx={100} cy={124} r={12} fill={GOLD} opacity={0.2} />
    </G>
  );
};

const Face: React.FC<{ stage: Exclude<Stage, 5>; a: (typeof ANCHOR)[1]; closed: boolean; browRaise: boolean }> = ({ stage, a, closed, browRaise }) => {
  const glow = stage === 4;
  const eyeFill = glow ? GOLD : '#FFFFFF';
  const lx = 100 - a.eyeDx;
  const rx = 100 + a.eyeDx;
  return (
    <G>
      {[lx, rx].map((x) =>
        closed ? (
          <Path key={x} d={`M${x - a.eyeR} ${a.eyeY} Q${x} ${a.eyeY + 4} ${x + a.eyeR} ${a.eyeY}`} stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : (
          <G key={x}>
            <Ellipse cx={x} cy={a.eyeY} rx={a.eyeR * (glow ? 1.1 : 0.85)} ry={glow ? a.eyeR * 0.55 : a.eyeR} fill={eyeFill} />
            {!glow && <Circle cx={x + 1} cy={a.eyeY + 1} r={a.eyeR * 0.5} fill={INK} />}
            {!glow && <Circle cx={x + 3} cy={a.eyeY - 2} r={a.eyeR * 0.2} fill="#FFFFFF" />}
          </G>
        )
      )}
      {/* brows on Rock + Monolith — the left one is the easter-egg brow */}
      {stage >= 3 && (
        <G>
          <Path
            d={`M${lx - 9} ${a.eyeY - a.eyeR - 6} L${lx + 8} ${a.eyeY - a.eyeR - 8}`}
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            transform={browRaise ? `translate(0 -10) rotate(-14 ${lx} ${a.eyeY - a.eyeR - 7})` : undefined}
          />
          <Path d={`M${rx - 8} ${a.eyeY - a.eyeR - 8} L${rx + 9} ${a.eyeY - a.eyeR - 6}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </G>
      )}
      {/* mouth: a smug smirk when the brow goes up */}
      {browRaise ? (
        <Path d={`M${100 - 8} ${a.eyeY + 16} Q${100 + 2} ${a.eyeY + 20} ${100 + 10} ${a.eyeY + 12}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <Path d={`M${100 - 6} ${a.eyeY + 14} Q100 ${a.eyeY + 20} ${100 + 6} ${a.eyeY + 14}`} stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      )}
      {stage <= 2 && (
        <G opacity={0.5}>
          <Ellipse cx={lx - 6} cy={a.eyeY + 10} rx={5} ry={3} fill="#FF8A8A" />
          <Ellipse cx={rx + 6} cy={a.eyeY + 10} rx={5} ry={3} fill="#FF8A8A" />
        </G>
      )}
    </G>
  );
};

type Acc = { main: string; dark: string };

/** Accessories drawn behind the body. */
const Behind: React.FC<{ family: FamilyKey; stage: Exclude<Stage, 5>; acc: Acc }> = ({ family, stage, acc }) => {
  if (family === 'wanderer' && stage === 4)
    return <Path d="M54 70 C30 110 34 160 44 182 L156 182 C166 160 170 110 146 70 Z" fill={acc.dark} opacity={0.9} />;
  if (family === 'scholar' && stage === 4)
    return (
      <G fill={acc.main} opacity={0.9}>
        {[
          [34, 50],
          [166, 46],
          [24, 118],
          [178, 112],
        ].map(([x, y], i) => (
          <G key={i} transform={`translate(${x} ${y})`}>
            <Rect x={-9} y={-9} width={18} height={18} rx={3} fill={acc.dark} />
            <Path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#FFFFFF" strokeWidth={2} />
          </G>
        ))}
      </G>
    );
  return null;
};

/** Accessories drawn in front: head, face, hand. */
const Front: React.FC<{ family: FamilyKey; stage: Exclude<Stage, 5>; a: (typeof ANCHOR)[1]; acc: Acc }> = ({ family, stage, a, acc }) => {
  const head = `translate(100 ${a.top}) scale(${a.s})`;
  const hand = `translate(${a.hand[0]} ${a.hand[1]}) scale(${a.s})`;
  const lx = 100 - a.eyeDx;
  const rx = 100 + a.eyeDx;

  if (family === 'scholar')
    return (
      <G>
        {/* round glasses */}
        <G stroke={INK} strokeWidth={2.5} fill="none">
          <Circle cx={lx} cy={a.eyeY} r={a.eyeR + 4} />
          <Circle cx={rx} cy={a.eyeY} r={a.eyeR + 4} />
          <Path d={`M${lx + a.eyeR + 4} ${a.eyeY} L${rx - a.eyeR - 4} ${a.eyeY}`} />
        </G>
        {stage >= 2 && (
          <G transform={hand}>
            <Rect x={-12} y={-16} width={24} height={30} rx={3} fill={acc.main} />
            <Rect x={-12} y={-16} width={5} height={30} rx={2} fill={acc.dark} />
            <Rect x={-4} y={-8} width={12} height={3} rx={1.5} fill="#FFFFFF" opacity={0.8} />
          </G>
        )}
        {stage >= 3 && (
          <G transform={head}>
            <Polygon points="-30,-6 0,-18 30,-6 0,6" fill={INK} />
            <Rect x={-14} y={-6} width={28} height={10} fill={INK} />
            <Path d="M24 -6 L28 14" stroke={GOLD} strokeWidth={2.5} />
            <Circle cx={28} cy={16} r={3} fill={GOLD} />
          </G>
        )}
      </G>
    );

  if (family === 'builder')
    return (
      <G>
        <G transform={head}>
          <Path d="M-26 0 C-26 -20 -14 -28 0 -28 C14 -28 26 -20 26 0 Z" fill={acc.main} />
          <Rect x={-32} y={-2} width={64} height={7} rx={3.5} fill={acc.dark} />
          <Rect x={-3} y={-28} width={6} height={26} fill={acc.dark} opacity={0.6} />
          {stage === 4 && <Circle cx={0} cy={-14} r={6} fill="#FFF6C2" />}
          {stage === 4 && <Circle cx={0} cy={-14} r={12} fill="#FFF6C2" opacity={0.3} />}
        </G>
        {stage >= 2 && (
          <G transform={`${hand} rotate(-20)`}>
            <Rect x={-2.5} y={-6} width={5} height={30} rx={2} fill="#8A5A2B" />
            <Rect x={-12} y={-14} width={24} height={11} rx={2} fill="#9AA3B5" />
          </G>
        )}
        {stage === 4 && (
          <G fill={GOLD}>
            <Path d="M28 80 C34 66 58 66 62 80 Z" />
            <Path d="M138 80 C142 66 166 66 172 80 Z" />
          </G>
        )}
      </G>
    );

  if (family === 'creator')
    return (
      <G>
        <G transform={head}>
          <Ellipse cx={4} cy={-6} rx={28} ry={10} fill={acc.main} />
          <Circle cx={10} cy={-16} r={4} fill={acc.dark} />
        </G>
        {stage >= 2 && (
          <G transform={`${hand} rotate(25)`}>
            <Rect x={-2.5} y={-22} width={5} height={30} rx={2} fill="#C98B4A" />
            <Path d="M-4 -22 C-4 -32 4 -32 4 -22 Z" fill={acc.main} />
          </G>
        )}
        {stage >= 3 && (
          <G fill={acc.main}>
            <Circle cx={40} cy={70} r={5} />
            <Rect x={44} y={48} width={2.5} height={22} />
            <Path d="M46.5 48 L56 52 L56 56 L46.5 52 Z" />
            <Circle cx={164} cy={60} r={4} fill={acc.dark} />
            <Rect x={167} y={42} width={2.2} height={18} fill={acc.dark} />
          </G>
        )}
        {stage === 4 && (
          <G>
            <Ellipse cx={46} cy={160} rx={20} ry={12} fill="#F5E6CC" />
            {[FAMILY_ACCENT.scholar.main, FAMILY_ACCENT.builder.main, FAMILY_ACCENT.wanderer.main, acc.main].map((col, i) => (
              <Circle key={i} cx={36 + i * 7} cy={157 + (i % 2) * 5} r={3.5} fill={col} />
            ))}
          </G>
        )}
      </G>
    );

  // wanderer
  const scarfY = stage === 1 ? 166 : stage === 2 ? 160 : stage === 3 ? 156 : 72;
  return (
    <G>
      <Path d={`M${100 - 30 * a.s} ${scarfY} Q100 ${scarfY + 10} ${100 + 30 * a.s} ${scarfY}`} stroke={acc.main} strokeWidth={9 * a.s} fill="none" strokeLinecap="round" />
      <Path d={`M${100 + 18 * a.s} ${scarfY + 4} L${100 + 26 * a.s} ${scarfY + 22 * a.s}`} stroke={acc.dark} strokeWidth={7 * a.s} strokeLinecap="round" />
      {stage === 2 && (
        <G transform={hand}>
          <Rect x={-2.5} y={-34} width={5} height={52} rx={2} fill="#8A5A2B" />
          <Circle cx={0} cy={-36} r={5} fill={acc.main} />
        </G>
      )}
      {stage >= 3 && (
        <G transform={hand}>
          <Path d="M0 -26 L0 -18" stroke={INK} strokeWidth={2} />
          <Rect x={-9} y={-18} width={18} height={4} rx={2} fill={INK} />
          <Rect x={-7} y={-14} width={14} height={18} rx={4} fill="#FFE9A8" />
          <Circle cx={0} cy={-5} r={14} fill="#FFE9A8" opacity={0.35} />
          <Rect x={-9} y={4} width={18} height={4} rx={2} fill={INK} />
        </G>
      )}
    </G>
  );
};

// ───────────── Stage 5: the Flowkeeper (mascot) ─────────────
const SAND = [
  [34, 60, 2.5],
  [52, 34, 1.8],
  [160, 40, 2.2],
  [174, 82, 1.6],
  [28, 120, 1.8],
  [150, 22, 1.4],
  [70, 20, 1.6],
] as const;

const Flowkeeper: React.FC<{ uid: string; closed: boolean; silhouette: boolean }> = ({ uid, closed, silhouette }) => {
  const hood = silhouette ? '#2A2540' : `url(#hood${uid})`;
  return (
    <G>
      {/* cape */}
      <Path d="M58 110 C40 140 36 170 46 184 L154 184 C164 170 160 140 142 110 Z" fill={silhouette ? '#2A2540' : '#1E2352'} />
      <Path d="M58 110 C46 140 44 168 50 184 L70 184 C62 160 64 130 76 112 Z" fill={silhouette ? '#2A2540' : '#2B3270'} opacity={0.8} />
      {/* hood with two swept points */}
      <Path d="M100 30 C126 30 146 52 150 84 C152 104 146 120 132 128 L68 128 C54 120 48 104 50 84 C54 52 74 30 100 30 Z" fill={hood} />
      <Path d="M58 60 L30 34 L62 50 Z" fill={hood} />
      <Path d="M142 60 L172 30 L138 50 Z" fill={hood} />
      {!silhouette && (
        <>
          <Path d="M100 30 C126 30 146 52 150 84 C152 104 146 120 132 128 L68 128 C54 120 48 104 50 84 C54 52 74 30 100 30 Z" fill="none" stroke={GOLD} strokeWidth={3} />
          {/* shadowed face + glowing eyes */}
          <Ellipse cx={100} cy={92} rx={34} ry={26} fill="#0B0F2A" />
          {closed ? (
            <G stroke="#FFE08A" strokeWidth={3} strokeLinecap="round">
              <Path d="M80 92 L92 92" />
              <Path d="M108 92 L120 92" />
            </G>
          ) : (
            <G>
              <Path d="M78 88 L94 92 L80 98 Z" fill="#FFE08A" />
              <Path d="M122 88 L106 92 L120 98 Z" fill="#FFE08A" />
              <Circle cx={86} cy={93} r={8} fill="#FFE08A" opacity={0.25} />
              <Circle cx={114} cy={93} r={8} fill="#FFE08A" opacity={0.25} />
            </G>
          )}
          {/* gem */}
          <Polygon points="100,38 110,52 100,66 90,52" fill={GOLD} />
          <Polygon points="100,44 105,52 100,60 95,52" fill="#FFF3C4" />
          {/* collar gem */}
          <Polygon points="100,124 108,134 100,144 92,134" fill={GOLD} />
          {/* hourglass held at the side */}
          <G transform="translate(150 132) rotate(-8)">
            <Rect x={-20} y={-34} width={40} height={6} rx={3} fill={GOLD} />
            <Rect x={-20} y={28} width={40} height={6} rx={3} fill={GOLD} />
            <Rect x={-17} y={-28} width={3} height={56} fill="#C9962E" />
            <Rect x={14} y={-28} width={3} height={56} fill="#C9962E" />
            <Path d="M-12 -28 L12 -28 C12 -12 4 -4 2 0 C4 4 12 12 12 28 L-12 28 C-12 12 -4 4 -2 0 C-4 -4 -12 -12 -12 -28 Z" fill="#D9E6FF" opacity={0.55} />
            <Path d="M-8 -20 L8 -20 C6 -10 2 -4 0 -2 C-2 -4 -6 -10 -8 -20 Z" fill="#FFB547" />
            <Path d="M-10 26 L10 26 C8 18 4 14 0 13 C-4 14 -8 18 -10 26 Z" fill="#FFB547" />
            <Rect x={-0.8} y={-2} width={1.6} height={15} fill="#FFB547" />
          </G>
          {/* hand */}
          <Circle cx={134} cy={136} r={8} fill="#E6B98A" />
          {/* floating sand */}
          {SAND.map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={GOLD} opacity={0.85} />
          ))}
        </>
      )}
    </G>
  );
};
