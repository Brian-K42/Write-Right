export interface Project {
  id: string;
  title: string;
  specs: string;
  topics: string[];
  evaluations: TopicEvaluation[];
  selectedTopic: string | null;
  sources: Source[];
  documentText: string;
  updatedAt: number;
}

export interface TopicEvaluation {
  topic: string;
  overallScore: number;
  complexity: { score: number; blurb: string };
  nicheness: { score: number; blurb: string };
  fit: { score: number; blurb: string };
}

export interface Source {
  id: string;
  url: string;
  title: string;
  summary: string;
  category: string;
}
