import { GoogleGenAI, Type } from '@google/genai';
import { Source, TopicEvaluation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateTopics(specs: string, topics: string[]): Promise<TopicEvaluation[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate the following topics for a writing assignment.
Assignment Specs:
${specs}

Topics to evaluate:
${topics.map(t => `- ${t}`).join('\n')}

For each topic, provide an overall difficulty score (0-100, where 100 means very difficult to write about), and subscores for:
- complexity (0-100, how hard the topic is to understand/write about)
- nicheness (0-100, how niche it is, meaning less information is available online)
- fit (0-100, how well it addresses the assignment specs)

Also provide a short blurb explaining each subscore.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            overallScore: { type: Type.NUMBER, description: "0-100, 100 is most difficult overall" },
            complexity: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                blurb: { type: Type.STRING }
              }
            },
            nicheness: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                blurb: { type: Type.STRING }
              }
            },
            fit: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                blurb: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export async function generateInitialSources(topic: string, specs: string): Promise<Omit<Source, 'id'>[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find 3-4 good introductory sources for the topic "${topic}" which is being written for an assignment with these specs: "${specs}".
Provide real, accessible URLs (like Wikipedia, major news outlets, open access journals, or educational sites).
Return the result EXACTLY as a JSON array of objects with the following keys:
- url (string)
- title (string)
- summary (string, 1-2 sentences)
- category (string, e.g., Background, Case Study, Theory)
Do not include any markdown formatting like \`\`\`json, just the raw JSON array.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  let text = response.text || '[]';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse sources JSON", text);
    return [];
  }
}

export async function summarizeSource(url: string, topic: string): Promise<Omit<Source, 'id' | 'url'>> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the content of this URL: ${url}\nFocus on how it relates to the topic: "${topic}". Provide a title, a short summary, and a category (e.g., Background, Methodology, Case Study).
Return the result EXACTLY as a JSON object with the following keys:
- title (string)
- summary (string)
- category (string)
Do not include any markdown formatting like \`\`\`json, just the raw JSON object.`,
    config: {
      tools: [{ urlContext: {} }]
    }
  });
  
  let text = response.text || '{}';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse source summary JSON", text);
    return { title: url, summary: "Failed to summarize.", category: "Uncategorized" };
  }
}

export async function checkWriting(specs: string, topic: string, text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate the following draft text for a writing assignment.
Assignment Specs:
${specs}

Topic:
${topic}

Draft Text:
${text}

Does the text accurately match the prompt? Where and why does it fall short? Provide constructive feedback in Markdown format. Be specific and helpful.`
  });
  
  return response.text || '';
}
