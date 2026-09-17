export type SelectionCandidate = {
  id: string;
  embedding: number[];
  weight: number;
};

export type Selection = {
  ids: string[];
  objective: number;
  utility: number;
  diversity: number;
};

export class SelectionError extends Error {}
