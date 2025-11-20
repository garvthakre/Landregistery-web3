// src/lib/gemini.js
import { GoogleGenAI, SchemaType } from "@google/genai";

const API_KEY = import.meta?.env?.VITE_GEMINI_API_KEY || "";

function getGemini() {
  if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey: API_KEY });
}

// Schema for predictable structured output
export const landDocSchema = {
  type: SchemaType.OBJECT,
  properties: {
    ownerName: { type: SchemaType.STRING },
    village: { type: SchemaType.STRING },
    landArea: { type: SchemaType.NUMBER },
    unit: { type: SchemaType.STRING },
    notes: { type: SchemaType.STRING },
  },
  required: ["ownerName", "village", "landArea", "unit"],
};

// export function getGemini() {
//   if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");
//   return new GoogleGenerativeAI({ apiKey: API_KEY });
// }

export async function extractLandDocFields(file) {
  const genAI = getGemini();

  // Upload file to Gemini file store (browser supported)
  const uploadResp = await genAI.uploadFile(file, { mimeType: file.type });

  // Ask model to extract structured fields as JSON
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: landDocSchema,
    },
  });

  const prompt = `
You are an extraction assistant for Indian land documents. 
Return a strict JSON that matches the provided schema:
- ownerName: person name written as owner
- village: village/town in the document
- landArea: numeric area value (convert to number, decimals allowed)
- unit: one of: acres, hectares, square meters, bigha (normalize wording)
- notes: short explanation of how values were derived

If multiple values appear, pick the most prominent or latest. If a field is missing, leave it empty string (""), or for landArea use 0.
Do not add extra keys.
`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: uploadResp.file.uri, mimeType: uploadResp.file.mimeType } },
          { text: prompt },
        ],
      },
    ],
  });

  const text = await result.response.text();
  const data = JSON.parse(text);

  return {
    ownerName: (data.ownerName || "").trim(),
    village: (data.village || "").trim(),
    landArea: Number(data.landArea ?? 0),
    unit: (data.unit || "").toLowerCase().trim(),
    notes: data.notes || "",
  };
}
