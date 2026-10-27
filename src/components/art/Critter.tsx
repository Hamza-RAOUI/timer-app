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
const LAVA = '#FF8A3D';
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
          <Creature uid={uid} family={family} stage={stage} closed={closed} browRaise={browRaise} silhouette={silhouette} />
        )}
      </G>
    </Svg>
  );
};

// ───────────── Stages 1–4 ─────────────
const Creature: React.FC<{ uid: string; family: FamilyKey; stage: Exclude<Stage, 5>; closed: boolean; browRaise: boolean; silhouette: boolean }> = ({ uid, family, stage, closed, browRaise, silhouette }) => {
  const c = silhouette ? { fill: '#2A2540', shade: '#2A2540', light: '#2A2540' } : BODY[stage];
  const a = ANCHOR[stage];
  const acc = FAMILY_ACCENT[family];
  return (
    <G>
      {/* back accessories (cloak, runes) */}
      {!silhouette && <Behind family={family} stage={stage} acc={acc} />}
      <Body stage={stage} c={c} uid={uid} silhouette={silhouette} />
      {!silhouette && (
        <>
          <Face stage={stage} a={a} closed={closed} browRaise={browRaise} />
          <Front family={family} stage={stage} a={a} acc={acc} />
        </>
      )}
    </G>
  );
};

const Body: React.FC<{ stage: Exclude<Stage, 5>; c: { fill: string; shade: string; light: string }; uid: string; silhouette: boolean }> = ({ stage, c, uid, silhouette }) => {
  const g = (id: string) => (silhouette ? c.fill : `url(#${id}${uid})`);
  if (stage === 1)
    return (
      <G>
        <Defs>
          <RadialGradient id={`gr${uid}`} cx="38%" cy="40%" r="70%">
            <Stop offset="0" stopColor="#FFE7A6" />
            <Stop offset="0.45" stopColor="#F6B740" />
            <Stop offset="1" stopColor="#C9801A" />
          </RadialGradient>
        </Defs>
        {/* floating sand */}
        {!silhouette &&
          [
            [58, 110, 2.2],
            [146, 118, 1.8],
            [52, 150, 1.6],
            [150, 160, 2],
            [120, 86, 1.4],
          ].map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill={GOLD} opacity={0.8} />)}
        {/* feet + nub arms */}
        <Ellipse cx={86} cy={180} rx={10} ry={5.5} fill={c.shade} />
        <Ellipse cx={114} cy={180} rx={10} ry={5.5} fill={c.shade} />
        <Ellipse cx={64} cy={152} rx={7} ry={5} fill={c.shade} transform="rotate(-30 64 152)" />
        <Ellipse cx={136} cy={152} rx={7} ry={5} fill={c.shade} transform="rotate(30 136 152)" />
        <Path d="M100 84 C120 106 136 128 136 150 C136 170 120 182 100 182 C80 182 64 170 64 150 C64 128 80 106 100 84 Z" fill={g('gr')} />
        {!silhouette && (
          <>
            <Path d="M100 84 C120 106 136 128 136 150 C136 170 120 182 100 182" fill="none" stroke="#FFF1C8" strokeWidth={2.5} opacity={0.55} />
            {/* sand texture */}
            {[
              [90, 166],
              [112, 170],
              [120, 132],
              [80, 140],
              [104, 118],
            ].map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={1.3} fill="#C9801A" opacity={0.5} />
            ))}
            <Ellipse cx={84} cy={122} rx={6} ry={11} fill="#FFFFFF" opacity={0.55} transform="rotate(22 84 122)" />
            <Circle cx={92} cy={106} r={2.4} fill="#FFFFFF" opacity={0.8} />
          </>
        )}
      </G>
    );
  if (stage === 2)
    return (
      <G>
        <Defs>
          <RadialGradient id={`pb${uid}`} cx="35%" cy="35%" r="75%">
            <Stop offset="0" stopColor="#F1E6D2" />
            <Stop offset="0.5" stopColor="#CDBB9F" />
            <Stop offset="1" stopColor="#8F7C61" />
          </RadialGradient>
        </Defs>
        {/* little stones at the feet */}
        {!silhouette && (
          <>
            <Ellipse cx={46} cy={180} rx={6} ry={3.5} fill="#A99579" />
            <Ellipse cx={156} cy={181} rx={5} ry={3} fill="#A99579" />
          </>
        )}
        <Ellipse cx={80} cy={180} rx={12} ry={6} fill={c.shade} />
        <Ellipse cx={120} cy={180} rx={12} ry={6} fill={c.shade} />
        <Ellipse cx={52} cy={150} rx={8} ry={6} fill={c.shade} transform="rotate(-25 52 150)" />
        <Ellipse cx={150} cy={150} rx={8} ry={6} fill={c.shade} transform="rotate(25 150 150)" />
        <Path d="M54 150 C52 122 74 106 100 106 C128 106 150 120 148 150 C147 172 128 182 100 182 C72 182 55 172 54 150 Z" fill={g('pb')} />
        {!silhouette && (
          <>
            <Path d="M148 150 C147 172 128 182 100 182" fill="none" stroke="#FFF6E6" strokeWidth={2.5} opacity={0.5} />
            {/* granite speckles + a hairline crack */}
            {[
              [70, 160, 1.8],
              [128, 168, 1.6],
              [136, 138, 1.4],
              [84, 172, 1.2],
              [118, 122, 1.4],
              [64, 138, 1.2],
            ].map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} fill="#7A6850" opacity={0.6} />
            ))}
            <Path d="M128 116 L122 126 L126 132" stroke="#8F7C61" strokeWidth={1.6} fill="none" strokeLinecap="round" />
            <Ellipse cx={74} cy={126} rx={10} ry={6} fill="#FFFFFF" opacity={0.45} transform="rotate(-25 74 126)" />
            {/* moss cap + two-leaf sprout */}
            <Path d="M80 110 C88 102 112 102 122 110 C114 114 88 114 80 110 Z" fill="#6FBF5A" />
            <Path d="M100 106 C99 96 100 90 104 84" stroke="#4E9E3E" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M104 86 C110 76 122 76 124 82 C118 88 110 88 104 86 Z" fill="#7FD06A" />
            <Path d="M102 92 C94 84 84 86 82 92 C88 96 96 96 102 92 Z" fill="#6FBF5A" />
          </>
        )}
      </G>
    );
  if (stage === 3)
    return (
      <G>
        <Defs>
          <LinearGradient id={`cr${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D2FFF7" />
            <Stop offset="0.45" stopColor="#5EEAD4" />
            <Stop offset="1" stopColor="#139A8A" />
          </LinearGradient>
          <RadialGradient id={`cg${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#5EEAD4" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#5EEAD4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* arms with faceted fists */}
        <Polygon points="44,124 60,116 66,148 48,160 36,146" fill={c.shade} />
        <Polygon points="36,146 48,160 56,156 46,140" fill={c.fill} opacity={0.7} />
        <Polygon points="156,124 140,116 134,148 152,160 164,146" fill={c.shade} />
        <Polygon points="164,146 152,160 144,156 154,140" fill={c.fill} opacity={0.7} />
        {/* legs */}
        <Polygon points="70,182 94,182 94,166 72,164" fill={c.shade} />
        <Polygon points="130,182 106,182 106,166 128,164" fill={c.shade} />
        {/* faceted body */}
        <Polygon points="62,104 88,84 126,86 148,108 152,150 132,174 70,174 50,148" fill={c.fill} />
        <Polygon points="126,86 148,108 152,150 132,174 112,174 128,140 124,104" fill={c.shade} opacity={silhouette ? 1 : 0.7} />
        {!silhouette && (
          <>
            <Polygon points="62,104 88,84 98,92 72,112" fill={c.light} />
            <Polygon points="50,148 62,104 72,112 66,146" fill={c.light} opacity={0.45} />
            <Polygon points="70,174 66,146 86,160 98,174" fill={c.shade} opacity={0.45} />
            <Path d="M72 112 L98 92 L124 104 M66 146 L86 160 L112 156 L128 140" stroke={c.shade} strokeWidth={1.6} fill="none" opacity={0.7} strokeLinejoin="round" />
            {/* crystals with glow */}
            <Circle cx={108} cy={74} r={26} fill={`url(#cg${uid})`} />
          </>
        )}
        <Polygon points="94,88 104,58 114,88" fill={g('cr')} />
        <Polygon points="112,90 126,66 128,94" fill={g('cr')} opacity={silhouette ? 1 : 0.85} />
        <Polygon points="84,90 88,72 96,90" fill={g('cr')} opacity={silhouette ? 1 : 0.8} />
        {!silhouette && (
          <>
            <Polygon points="100,86 104,64 106,86" fill="#FFFFFF" opacity={0.7} />
            <Path d={`M122 58 Q122 64 128 64 Q122 64 122 70 Q122 64 116 64 Q122 64 122 58 Z`} fill="#D2FFF7" />
          </>
        )}
      </G>
    );
  // Monolith: stacked rock plates, boulder fists, glowing lava-sand cracks.
  const lava = (d: string, w = 3) => (
    <G>
      <Path d={d} stroke={LAVA} strokeWidth={w * 2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.22} />
      <Path d={d} stroke={LAVA} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke="#FFE3A3" strokeWidth={w * 0.35} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
  return (
    <G>
      {/* rubble */}
      <Polygon points="30,182 38,174 46,182" fill={c.shade} />
      <Polygon points="152,182 160,172 170,182" fill={c.shade} />
      {/* legs */}
      <Polygon points="66,182 96,182 96,158 70,156" fill={c.shade} />
      <Polygon points="134,182 104,182 104,158 130,156" fill={c.shade} />
      <Polygon points="66,182 96,182 96,176 66,176" fill={c.fill} opacity={0.6} />
      <Polygon points="134,182 104,182 104,176 134,176" fill={c.fill} opacity={0.6} />
      {/* arms + boulder fists */}
      <Polygon points="34,84 58,78 62,118 56,148 30,156 20,128" fill={c.fill} />
      <Polygon points="20,128 30,156 56,148 52,132 30,124" fill={c.shade} />
      <Polygon points="166,84 142,78 138,118 144,148 170,156 180,128" fill={c.fill} />
      <Polygon points="180,128 170,156 144,148 148,132 170,124" fill={c.shade} />
      {/* torso-head block */}
      <Polygon points="56,64 78,46 122,46 146,64 150,118 140,166 60,166 50,118" fill={c.fill} />
      <Polygon points="146,64 150,118 140,166 116,166 128,120 130,72" fill={c.shade} />
      <Polygon points="60,64 80,50 100,52 96,66 70,72" fill={c.light} />
      <Polygon points="104,52 120,48 140,62 128,70 102,66" fill={c.light} opacity={0.75} />
      {/* shoulder boulders */}
      <Polygon points="30,74 52,58 70,70 60,92 34,90" fill={c.fill} />
      <Polygon points="30,74 52,58 60,66 40,80" fill={c.light} />
      <Polygon points="170,74 148,58 130,70 140,92 166,90" fill={c.fill} />
      <Polygon points="170,74 148,58 140,66 160,80" fill={c.light} opacity={0.75} />
      {/* plate seams */}
      <Path d="M54 118 L80 112 L98 120 L122 112 L148 118 M64 146 L90 140 L112 146 L138 140" stroke={c.shade} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {/* lava cracks + core */}
      {lava('M70 124 L82 132 L76 146 L86 158')}
      {lava('M130 122 L120 134 L128 150')}
      {lava('M36 104 L46 112 L42 124', 2.4)}
      {lava('M164 104 L154 112 L158 124', 2.4)}
      <Circle cx={100} cy={132} r={14} fill={LAVA} opacity={0.2} />
      <Polygon points="100,122 109,132 100,142 91,132" fill={LAVA} />
      <Polygon points="100,126 105,132 100,138 95,132" fill="#FFE3A3" />
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
/** 4-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

const SPARKLES = [
  [30, 52, 7, '#E9D5FF'],
  [176, 40, 6, '#E9D5FF'],
  [20, 120, 4, '#C4B5FD'],
  [184, 112, 5, GOLD],
  [62, 18, 4, GOLD],
  [150, 16, 3.5, '#C4B5FD'],
] as const;
const GRAINS = [
  [44, 84, 2],
  [160, 70, 1.8],
  [176, 150, 2],
  [26, 160, 1.6],
  [120, 12, 1.6],
] as const;

/** The grain, grown up: a golden little body under a midnight hood, eyes glowing, hourglass in hand. */
const Flowkeeper: React.FC<{ uid: string; closed: boolean; silhouette: boolean }> = ({ uid, closed, silhouette }) => {
  const dark = '#2A2540';
  const hood = silhouette ? dark : `url(#hood${uid})`;
  const body = silhouette ? dark : `url(#fkBody${uid})`;
  const gold = silhouette ? dark : GOLD;
  return (
    <G>
      <Defs>
        <LinearGradient id={`fkBody${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD27A" />
          <Stop offset="1" stopColor="#D9932F" />
        </LinearGradient>
        <LinearGradient id={`fkSwirl${uid}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#A78BFA" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#A78BFA" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#6C7BFF" stopOpacity={0.1} />
        </LinearGradient>
        <RadialGradient id={`fkSand${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFC56B" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFC56B" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* magic trails */}
      {!silhouette && (
        <G fill="none" strokeLinecap="round">
          <Path d="M24 158 C4 116 30 62 76 64" stroke={`url(#fkSwirl${uid})`} strokeWidth={7} />
          <Path d="M178 168 C200 126 178 86 146 88" stroke={`url(#fkSwirl${uid})`} strokeWidth={5} />
          <Path d="M36 180 C72 160 122 196 170 174" stroke={`url(#fkSwirl${uid})`} strokeWidth={4} opacity={0.8} />
          <Path d="M54 40 C70 20 96 14 118 20" stroke="#C4B5FD" strokeWidth={2} opacity={0.5} />
        </G>
      )}

      {/* cape */}
      <Path d="M64 108 C32 128 26 168 40 186 L160 186 C176 168 170 128 136 108 Z" fill={silhouette ? dark : '#1E1B4B'} />
      {!silhouette && <Path d="M64 108 C32 128 26 168 40 186" stroke="#7C6CF0" strokeWidth={3} fill="none" opacity={0.7} />}
      {!silhouette && <Path d="M40 186 C34 176 22 178 16 186 Z" fill="#1E1B4B" />}

      {/* golden body + feet */}
      <Ellipse cx={86} cy={180} rx={11} ry={6} fill={silhouette ? dark : '#C9852A'} />
      <Ellipse cx={114} cy={180} rx={11} ry={6} fill={silhouette ? dark : '#C9852A'} />
      <Path d="M76 116 C68 140 70 166 84 178 L116 178 C130 166 132 140 124 116 Z" fill={body} />
      {!silhouette && <Ellipse cx={88} cy={150} rx={7} ry={12} fill="#FFE6A8" opacity={0.6} />}
      {/* scarf + collar gem */}
      <Path d="M70 118 C84 128 116 128 130 118 L126 132 C112 140 88 140 74 132 Z" fill={silhouette ? dark : '#3B2F8F'} />
      <Polygon points="100,124 108,134 100,144 92,134" fill={gold} />
      {!silhouette && <Polygon points="100,128 104,134 100,140 96,134" fill="#FFF3C4" />}
      {/* arm reaching to the hourglass */}
      <Path d="M122 130 C132 128 140 128 146 132" stroke={silhouette ? dark : '#D9932F'} strokeWidth={9} strokeLinecap="round" fill="none" />

      {/* hood with swept golden points */}
      <Path d="M58 60 C40 48 28 30 22 10 C40 26 58 38 74 46 Z" fill={gold} />
      <Path d="M142 60 C160 48 172 30 178 10 C160 26 142 38 126 46 Z" fill={gold} />
      {!silhouette && <Path d="M58 60 C46 50 36 36 30 22 C44 34 58 42 70 48 Z" fill="#B8862A" />}
      {!silhouette && <Path d="M142 60 C154 50 164 36 170 22 C156 34 142 42 130 48 Z" fill="#B8862A" />}
      <Path d="M100 22 C134 22 156 46 158 78 C160 100 150 114 132 120 L68 120 C50 114 40 100 42 78 C44 46 66 22 100 22 Z" fill={hood} />
      {!silhouette && (
        <>
          <Path d="M100 22 C134 22 156 46 158 78 C160 100 150 114 132 120 L68 120 C50 114 40 100 42 78 C44 46 66 22 100 22 Z" fill="none" stroke={GOLD} strokeWidth={3} />
          <Path d="M64 40 C76 30 88 26 100 26" stroke="#5A64D8" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
          {/* face in shadow + glowing eyes */}
          <Ellipse cx={100} cy={88} rx={34} ry={25} fill="#0B0F2A" />
          {closed ? (
            <G stroke="#FFE08A" strokeWidth={3} strokeLinecap="round">
              <Path d="M78 90 L92 92" />
              <Path d="M108 92 L122 90" />
            </G>
          ) : (
            <G>
              <Circle cx={85} cy={91} r={11} fill="#FFE08A" opacity={0.22} />
              <Circle cx={115} cy={91} r={11} fill="#FFE08A" opacity={0.22} />
              <Path d="M74 84 L95 91 L78 99 Z" fill="#FFE08A" />
              <Path d="M126 84 L105 91 L122 99 Z" fill="#FFE08A" />
              <Circle cx={84} cy={91} r={2} fill="#FFFFFF" />
              <Circle cx={116} cy={91} r={2} fill="#FFFFFF" />
            </G>
          )}
          {/* gem */}
          <Circle cx={100} cy={46} r={14} fill={GOLD} opacity={0.18} />
          <Polygon points="100,32 111,46 100,60 89,46" fill={GOLD} />
          <Polygon points="100,38 105.5,46 100,54 94.5,46" fill="#FFF3C4" />
        </>
      )}

      {/* ornate hourglass */}
      <G transform="translate(156 132) rotate(-10)">
        {!silhouette && <Circle cx={0} cy={0} r={38} fill={`url(#fkSand${uid})`} />}
        <Rect x={-23} y={-38} width={46} height={8} rx={4} fill={gold} />
        <Rect x={-23} y={30} width={46} height={8} rx={4} fill={gold} />
        <Rect x={-19} y={-31} width={4} height={62} rx={2} fill={silhouette ? dark : '#B8862A'} />
        <Rect x={15} y={-31} width={4} height={62} rx={2} fill={silhouette ? dark : '#B8862A'} />
        {!silhouette && (
          <>
            <Path d="M-13 -30 L13 -30 C13 -13 5 -4 2 0 C5 4 13 13 13 30 L-13 30 C-13 13 -5 4 -2 0 C-5 -4 -13 -13 -13 -30 Z" fill="#DCE6FF" opacity={0.45} />
            <Path d="M-9 -22 L9 -22 C7 -11 2 -4 0 -2 C-2 -4 -7 -11 -9 -22 Z" fill="#FFB547" />
            <Path d="M-11 28 L11 28 C9 19 4 14 0 13 C-4 14 -9 19 -11 28 Z" fill="#FFB547" />
            <Rect x={-0.9} y={-2} width={1.8} height={16} fill="#FFD27A" />
            <Path d="M-10 -26 C-10 -16 -6 -8 -3 -4" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.6} fill="none" />
          </>
        )}
      </G>
      {/* hand */}
      <Circle cx={146} cy={133} r={8} fill={silhouette ? dark : '#E8A945'} />

      {!silhouette && (
        <>
          {SPARKLES.map(([x, y, r, col], i) => (
            <Path key={i} d={sparkle(x, y, r)} fill={col} opacity={0.9} />
          ))}
          {GRAINS.map(([x, y, r], i) => (
            <Circle key={`g${i}`} cx={x} cy={y} r={r} fill={GOLD} opacity={0.85} />
          ))}
        </>
      )}
    </G>
  );
};
