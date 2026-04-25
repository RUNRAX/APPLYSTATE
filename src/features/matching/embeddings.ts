import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "grok-2-latest",
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embedding");
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function matchJob(profileVector: number[], jdVector: number[], threshold: number = 0.72) {
  const score = cosineSimilarity(profileVector, jdVector);
  return {
    isMatch: score >= threshold,
    score
  };
}
