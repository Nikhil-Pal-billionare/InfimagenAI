import { GoogleGenAI } from "@google/genai";
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export async function generateImage(prompt: string) {
  const response = await genAI.models.generateImages({
    model: "imagen-4.0-generate-001", prompt, config: { numberOfImages: 1 },
  });
  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error("No imageBytes from Gemini");
  return imageBytes;
}
export async function generateContent(prompt: string) {
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return response.text ?? "";
}
