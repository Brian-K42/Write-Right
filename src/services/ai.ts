import { GoogleGenAI, Type } from '@google/genai';
import { FeedbackPoint, Source, TopicEvaluation } from '../types';

let ai: GoogleGenAI | null = null;

export function initAI(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
}

function getAI(): GoogleGenAI {
  if (!ai) throw new Error('AI not initialized. Call initAI first.');
  return ai;
}

export async function evaluateTopics(specs: string, topics: string[]): Promise<TopicEvaluation[]> {
  const response = await getAI().models.generateContent({
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
      tools: [{ googleSearch: {} }, { urlContext: {} }],
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
  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find 3-4 good introductory sources for the topic "${topic}" which is being written for an assignment with these specs: "${specs}".
Provide real, accessible URLs (like Wikipedia, major news outlets, open access journals, or educational sites).
Return the result EXACTLY as a JSON array of objects with the following keys:
- url (string)
- title (string)
- summary (string, 1-2 sentences)
- content (string, a detailed markdown summary of the source's key points, arguments, and how they relate to the topic — several paragraphs)
- category (string, e.g., Background, Case Study, Theory)
Do not include any markdown formatting like \`\`\`json, just the raw JSON array.`,
    config: {
      tools: [{ googleSearch: {} }, { urlContext: {} }]
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
  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the content of this URL: ${url}\nFocus on how it relates to the topic: "${topic}". Provide a title, a short summary, a detailed content breakdown, and a category (e.g., Background, Methodology, Case Study).
Return the result EXACTLY as a JSON object with the following keys:
- title (string)
- summary (string, 1-2 sentences)
- content (string, a detailed markdown summary of the source's key points, arguments, data, and how they relate to the topic — several paragraphs)
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
    return { title: url, summary: "Failed to summarize.", content: "", category: "Uncategorized" };
  }
}

export async function checkWriting(specs: string, topic: string, text: string, sources: Source[]): Promise<FeedbackPoint[]> {
  const sourcesSection = sources.length > 0
    ? `\nSources the student is working with:\n${sources.map(s => `- "${s.title}" (${s.url}): ${s.summary}`).join('\n')}\n`
    : '';

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a writing tutor reviewing a student's draft. Provide targeted, section-by-section feedback.

Assignment Specs:
${specs}

Topic:
${topic}
${sourcesSection}
Draft Text:
${text}

For each piece of feedback, identify the EXACT substring from the draft text that you are commenting on. Copy it character-for-character — do not paraphrase or truncate. Each piece of feedback should be either "positive" (something done well) or "negative" (something that needs improvement). For negative feedback, provide a suggested revision that can directly replace the original section.

Return a JSON array of feedback objects. Aim for 4-8 feedback points covering different parts of the text.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING, description: "The exact substring from the draft text being commented on" },
            type: { type: Type.STRING, description: "Either 'positive' or 'negative'" },
            feedback: { type: Type.STRING, description: "The feedback explanation" },
            suggestion: { type: Type.STRING, description: "For negative feedback only: a suggested replacement for the section" },
          },
          required: ['section', 'type', 'feedback'],
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

// --- Mock implementations for demo mode ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function evaluateTopicsMock(_specs: string, topics: string[]): Promise<TopicEvaluation[]> {
  await delay(1200);
  return topics.map(topic => ({
    topic,
    overallScore: 35 + Math.floor(Math.random() * 40),
    complexity: {
      score: 30 + Math.floor(Math.random() * 45),
      blurb: `This topic has a moderate level of complexity. It requires understanding of key concepts but is approachable with sufficient research.`
    },
    nicheness: {
      score: 20 + Math.floor(Math.random() * 50),
      blurb: `There is a reasonable amount of literature available on this topic, though some angles may require deeper digging.`
    },
    fit: {
      score: 50 + Math.floor(Math.random() * 40),
      blurb: `This topic aligns well with the assignment requirements and can be explored within the given constraints.`
    }
  }));
}

export async function generateInitialSourcesMock(topic: string, _specs: string): Promise<Omit<Source, 'id'>[]> {
  await delay(1500);
  return [
    {
      url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(topic.replace(/ /g, '_')),
      title: `${topic} - Wikipedia`,
      summary: `A comprehensive overview of ${topic}, covering key definitions, history, and current developments.`,
      content: `## Overview\n\nThis Wikipedia article provides a broad introduction to **${topic}**, tracing its origins, key developments, and current state.\n\n## Key Points\n\n- Covers foundational definitions and terminology\n- Includes a historical timeline of major milestones\n- References multiple academic and institutional sources\n\n## Relevance\n\nThis is a good starting point for understanding the basic landscape before diving into more specialized research.`,
      category: 'Background'
    },
    {
      url: 'https://scholar.google.com',
      title: `Academic perspectives on ${topic}`,
      summary: `A collection of peer-reviewed research exploring various dimensions of ${topic}.`,
      content: `## Overview\n\nThis collection of academic papers presents multiple scholarly perspectives on **${topic}**.\n\n## Key Points\n\n- Peer-reviewed research from leading journals\n- Covers both theoretical frameworks and empirical studies\n- Includes meta-analyses and literature reviews\n\n## Relevance\n\nThese papers provide the academic rigor needed to support claims in your assignment. Look for specific data points and quotes to cite.`,
      category: 'Theory'
    },
    {
      url: 'https://www.nature.com',
      title: `Recent developments in ${topic}`,
      summary: `An analysis of recent trends and findings related to ${topic} from leading researchers.`,
      content: `## Overview\n\nThis article examines the latest research developments in **${topic}**, focusing on findings from the past few years.\n\n## Key Points\n\n- Highlights emerging trends and shifting perspectives\n- Discusses new methodologies being applied to the field\n- Identifies gaps in current understanding\n\n## Relevance\n\nUseful for demonstrating awareness of the current state of research and for identifying areas where your paper can contribute a fresh perspective.`,
      category: 'Case Study'
    }
  ];
}

export async function summarizeSourceMock(url: string, _topic: string): Promise<Omit<Source, 'id' | 'url'>> {
  await delay(1000);
  return {
    title: `Source from ${new URL(url).hostname}`,
    summary: 'This source provides relevant background information and analysis that can support your research. (Demo mode — connect an API key for real summaries.)',
    content: `## Source Summary\n\nThis source provides relevant background information and analysis.\n\n## Key Points\n\n- Contains general information applicable to the topic\n- May include data, arguments, or perspectives worth citing\n\n> *This is placeholder content. Enter a Gemini API key for real source analysis.*`,
    category: 'Background'
  };
}

export async function checkWritingMock(_specs: string, _topic: string, text: string, _sources: Source[]): Promise<FeedbackPoint[]> {
  await delay(1000);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const points: FeedbackPoint[] = [];

  if (sentences.length >= 1) {
    points.push({
      section: sentences[0].trim(),
      type: 'positive',
      feedback: 'Good opening sentence — it sets the context clearly for the reader.',
    });
  }
  if (sentences.length >= 3) {
    points.push({
      section: sentences[2].trim(),
      type: 'negative',
      feedback: 'This sentence could be strengthened with a specific citation or data point to support the claim.',
      suggestion: sentences[2].trim().replace(/\.$/, ', supported by recent studies (Smith, 2024).'),
    });
  }
  if (sentences.length >= 5) {
    points.push({
      section: sentences[4].trim(),
      type: 'positive',
      feedback: 'Strong use of evidence here — this effectively supports your argument.',
    });
  }
  if (sentences.length >= 2) {
    points.push({
      section: sentences[1].trim(),
      type: 'negative',
      feedback: 'Consider improving the transition from your opening to this point. The connection between ideas could be clearer.',
      suggestion: 'Furthermore, ' + sentences[1].trim().charAt(0).toLowerCase() + sentences[1].trim().slice(1),
    });
  }

  if (points.length === 0) {
    points.push({
      section: text.slice(0, Math.min(50, text.length)),
      type: 'negative',
      feedback: 'Your draft is quite short. Try expanding on your ideas with more detail and evidence. (Demo mode)',
      suggestion: text.slice(0, Math.min(50, text.length)) + ' [expand with supporting evidence and analysis]',
    });
  }

  return points;
}
