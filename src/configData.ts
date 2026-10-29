import poPsoJson from "../config/po_pso.json";

export interface ProgramOutcome {
  id: string;
  title: string;
  statement: string;
}

export interface ProgramSpecificOutcome {
  id: string;
  statement: string;
}

export interface BloomLevel {
  level: string;
  name: string;
  verbs: string;
}

export const PO_DATA: ProgramOutcome[] = poPsoJson.pos;
export const PSO_DATA: ProgramSpecificOutcome[] = poPsoJson.psos;
export const BLOOM_DATA: BloomLevel[] = poPsoJson.blooms;
export const SCALE_DESCRIPTION: string = poPsoJson.scale;

export function getPo(id: string): ProgramOutcome | undefined {
  return PO_DATA.find((p) => p.id === id);
}

export function getPso(id: string): ProgramSpecificOutcome | undefined {
  return PSO_DATA.find((p) => p.id === id);
}

export function getBloomName(levelNumber: number): string {
  const code = `L${levelNumber}`;
  const found = BLOOM_DATA.find((b) => b.level === code);
  return found ? `${found.level} ${found.name}` : `L${levelNumber}`;
}

export function getBloomCeiling(bloomLevel: number): number {
  // Bloom L1, L2 support max mapping of 2 or 1 for high cognitive POs
  return bloomLevel <= 2 ? 2 : 3;
}
