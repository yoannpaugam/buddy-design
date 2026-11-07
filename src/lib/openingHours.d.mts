export interface OhRule {
  months?: Set<number>;
  days?: Set<number>;
  nth?: Map<number, number[]>;
  times: [number, number][];
}
export function parseOpeningHours(raw: string | undefined | null): OhRule[] | null;
export function intervalsOn(rules: OhRule[] | null, y: number, m: number, d: number): [number, number][];
export function openState(rules: OhRule[] | null, at?: Date): { open: boolean; until?: number; opensAt?: number } | null;
export function fmtMinutes(m: number): string;
export function weekTable(rules: OhRule[] | null, from?: Date): { label: string; text: string }[] | null;
