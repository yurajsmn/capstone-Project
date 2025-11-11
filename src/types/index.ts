export interface ExampleType {
    id: number;
    name: string;
    isActive: boolean;
}

export type ExampleResponse = {
    data: ExampleType[];
    total: number;
};

export interface Review {
  id: number;
  text: string;
  source: string;
}

export interface AnalyzedReview extends Review {
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  aspects: string[];
}