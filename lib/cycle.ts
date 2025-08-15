// lib/cycle.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cycle_anchor';
const DEFAULT = '2025-08-03'; // initial Day 1 (local date)
const CYCLE_LENGTH = 60;

export type Anchor = string; // YYYY-MM-DD

export async function getCycleAnchor(): Promise<Anchor> {
  const s = await AsyncStorage.getItem(KEY);
  return s ?? DEFAULT;
}

export async function setCycleAnchor(yyyyMmDd: string) {
  await AsyncStorage.setItem(KEY, yyyyMmDd);
}

function toLocalDate(y: number, m: number, d: number) {
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function startOfDayUTC(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getCycleDayFor(anchor: Anchor, cycleLength = CYCLE_LENGTH) {
  const [y, m, d] = anchor.split('-').map(Number);
  const anchorLocalMidnight = toLocalDate(y, m!, d!);
  const now = new Date();
  const daysSince =
    Math.floor((startOfDayUTC(now) - startOfDayUTC(anchorLocalMidnight)) / 86_400_000) + 1;
  return ((Math.max(daysSince, 1) - 1) % cycleLength) + 1; // clamp & wrap 1..cycleLength
}

export function getCyclePhase(day: number) {
  if (day <= 15) return 'Setup';
  if (day <= 30) return 'Advance';
  if (day <= 45) return 'Distribution';
  return 'Reset';
}

export function toLocalYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
