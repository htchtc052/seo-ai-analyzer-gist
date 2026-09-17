export type SelectionCandidate = {
  id: string;
  embedding: number[];
  weight: number;
};

export type Selection = { ids: string[] };

export class SelectionError extends Error {}
