import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface HourglassProps {
  /** 0 = full top (just started) · 1 = drained (finished). */
  progress: number;
  color?: string;
  running?: boolean;
  size?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const Hourglass: React.FC<HourglassProps> = ({ progress, color = colors.accent, running = false, size = 64 }) => {
  const clipId = useRef(`hg-${Math.random().toString(36).slice(2, 8)}`).current;

  const TH = size;
  const W = size * 0.72;
  const capH = Math.max(4, size * 0.085);
  const cx = W / 2;
  const topY = capH;
  const botY = TH - capH;
  const neckY = TH / 2;
  const mx = W * 0.14; // bulb side margin
  const nw = W * 0.16; // neck width
  const neckL = cx - nw / 2;
  const neckR = cx + nw / 2;
  const lx = mx;
  const rx = W - mx;
  const cyl = (neckY - topY) * 0.55; // curve control distance

  // Curved hourglass silhouette (concave sides pinching at the neck).
  const d = [
    `M${lx},${topY}`,
    `L${rx},${topY}`,
    `C${rx},${topY + cyl} ${neckR},${neckY - cyl} ${neckR},${neckY}`,
    `C${neckR},${neckY + cyl} ${rx},${botY - cyl} ${rx},${botY}`,
    `L${lx},${botY}`,
    `C${lx},${botY - cyl} ${neckL},${neckY + cyl} ${neckL},${neckY}`,
    `C${neckL},${neckY - cyl} ${lx},${topY + cyl} ${lx},${topY}`,
    'Z',
  ].join(' ');

  const p = clamp(progress, 0, 1);
  const surfaceY = topY + p * (neckY - topY); // top sand surface drops toward neck
  const fillY = botY - p * (botY - neckY); // bottom pile rises from the base
  const capX = lx - 2;
  const capW = rx - lx + 4;
  const stroke = Math.max(2, size * 0.05);

  return (
    <View style={styles.wrap}>
      <Svg width={W} height={TH}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={d} />
          </ClipPath>
        </Defs>

        {/* glass */}
        <Path d={d} fill="rgba(79,70,229,0.05)" />

        {/* sand — clipped to the glass so it follows the curves */}
        <G clipPath={`url(#${clipId})`}>
          {p < 0.999 && <Rect x={0} y={surfaceY} width={W} height={neckY - surfaceY + 0.5} fill={color} opacity={0.9} />}
          {p > 0.001 && <Rect x={0} y={fillY} width={W} height={botY - fillY + 0.5} fill={color} opacity={0.9} />}
          {running && p > 0.001 && p < 0.999 && <Rect x={cx - 1} y={neckY} width={2} height={Math.max(0, fillY - neckY)} fill={color} />}
        </G>

        {/* outline + caps */}
        <Path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
        <Rect x={capX} y={0} width={capW} height={capH} rx={capH / 2} fill={color} />
        <Rect x={capX} y={TH - capH} width={capW} height={capH} rx={capH / 2} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
