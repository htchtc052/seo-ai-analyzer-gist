import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  basePath: "/v4",
  output: "standalone",
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    "/api/analyze": [
      "node_modules/onnxruntime-node/**/*",
      "node_modules/onnxruntime-common/**/*",
      "node_modules/@huggingface/transformers/**/*",
    ],
  },
};

export default nextConfig;
