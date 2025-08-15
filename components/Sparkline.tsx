// components/Sparkline.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  padding?: number;
};

export default function Sparkline({
  values = [],
  width = 320,
  height = 96,
  color = '#0ea5e9',
  strokeWidth = 2,
  padding = 4,
}: Props) {
  // Render an empty box if there's nothing to draw.
  if (!values || values.length < 2) {
    return <View style={{ width, height }} />;
  }

  // Filter out NaN/undefined and bail if we lost too much.
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (nums.length < 2) return <View style={{ width, height }} />;

  const w = Math.max(1, width - padding * 2);
  const h = Math.max(1, height - padding * 2);

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = Math.max(1e-9, max - min); // avoid div-by-zero

  const stepX = w / (nums.length - 1);

  // Build an SVG path “M x y L x y ...”
  let d = '';
  for (let i = 0; i < nums.length; i++) {
    const x = padding + i * stepX;
    // y=0 at top in SVG, so invert: higher price -> smaller y
    const norm = (nums[i] - min) / range;
    const y = padding + (1 - norm) * h;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
