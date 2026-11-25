export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface Article {
  id: number;
  title: string;
  content: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  author: { id: number; name: string };
}

export type ArticleListItem = Omit<Article, 'content'> & { snippet: string };

export interface ArticleInput {
  title: string;
  content: string;
  categoryId: number;
  status: ArticleStatus;
}

// the boxes gemini filled in from a pdf, nothing is saved until the editor clicks save
export interface ImportedArticle {
  title: string;
  whenToUse: string;
  steps: string;
  customer: string;
  escalate: string;
  more: string;
}
