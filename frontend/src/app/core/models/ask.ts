// an article the answer used, ref is the [n] the answer points to
export interface AskSource {
  ref: number;
  id: number;
  title: string;
}

export interface AskAnswer {
  answer: string;
  general: string;
  sources: AskSource[];
}
