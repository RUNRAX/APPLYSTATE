import OpenAI from 'openai';

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function embedText(text: string): Promise<number[]> {
  // Local fallback so the discovery worker can run without Groq API Key
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "dummy_key_for_build") {
    console.warn("Using dummy embedding vector because GROQ_API_KEY is missing locally.");
    return new Array(1536).fill(0.1);
  }

  try {
    const response = await ai.embeddings.create({
      model: "nomic-embed-text-v1_5", 
      input: text,
    });
    return response.data[0]?.embedding ?? [];
  } catch (error) {
    console.error("Embedding generation failed, falling back to dummy vector:", error);
    // Fallback to dummy vector if Groq model is missing or fails
    return Array.from({ length: 1536 }, () => Math.random());
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

import prisma from '@/lib/prisma';

export async function updateProfileVector(userId: string, profileText: string) {
  const vector = await embedText(profileText);
  if (vector.length === 0) throw new Error("Failed to generate embedding");
  
  // Format vector for pgvector: [0.1, 0.2, ...]
  const vectorStr = `[${vector.join(',')}]`;
  
  await prisma.$executeRaw`
    UPDATE "Profile" 
    SET "profileVector" = ${vectorStr}::vector 
    WHERE "userId" = ${userId}
  `;
  return vector;
}

export async function getProfileVector(userId: string): Promise<number[] | null> {
  const result = await prisma.$queryRaw<Array<{ profileVector: string }>>`
    SELECT "profileVector"::text FROM "Profile" WHERE "userId" = ${userId}
  `;
  
  if (!result || result.length === 0 || !result[0].profileVector) {
    return null;
  }
  
  // pgvector returns a string like "[0.1,0.2,...]"
  const vectorArr = JSON.parse(result[0].profileVector);
  return vectorArr;
}
