import { env, pipeline } from "@huggingface/transformers";

env.cacheDir = ".models";

const started = Date.now();
const extractor = await pipeline(
  "feature-extraction",
  "Xenova/multilingual-e5-small",
  { dtype: "q8" },
);
const output = await extractor(["query: проверка"], {
  pooling: "mean",
  normalize: true,
});

console.log(
  `model ready in ${Date.now() - started}ms, ${output.tolist()[0].length} dimensions`,
);
