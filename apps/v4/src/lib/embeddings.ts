import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

const STOPWORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves
а без более бы был была были было быть в вам вас весь во вот все всего всех вы где да даже для до его ее если есть ещё же за здесь и из или им их к как ко когда кто ли либо мне может мы на над надо не него нее нет ни них но ну о об однако он она они оно от очень по под при про с со так также такой там те то того тоже той только том тот ты у уже хоть чего чем что чтобы эта эти это этом этот я`
    .split(/\s+/)
    .filter(Boolean),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return Math.max(-1, Math.min(1, dot));
}

export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

const MODEL = "Xenova/multilingual-e5-small";
const BATCH_SIZE = 32;

env.cacheDir = ".models";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= pipeline("feature-extraction", MODEL, { dtype: "q8" });
  return extractorPromise;
}

async function embed(inputs: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const vectors: number[][] = [];
  for (let at = 0; at < inputs.length; at += BATCH_SIZE) {
    const output = await extractor(inputs.slice(at, at + BATCH_SIZE), {
      pooling: "mean",
      normalize: true,
    });
    vectors.push(...(output.tolist() as number[][]));
  }
  return vectors;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embed([`query: ${text}`]);
  return vector!;
}

export async function embedDocuments(
  texts: string[],
): Promise<{ vectors: number[][]; mode: "e5" }> {
  const vectors = await embed(texts.map((t) => `passage: ${t}`));
  return { vectors, mode: "e5" };
}
