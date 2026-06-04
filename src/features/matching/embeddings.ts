import OpenAI from 'openai';

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await ai.embeddings.create({
      model: "nomic-embed-text-v1_5", // Groq embedding model (if available) or fallback
      input: text,
    });
    return response.data[0]?.embedding ?? [];
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
