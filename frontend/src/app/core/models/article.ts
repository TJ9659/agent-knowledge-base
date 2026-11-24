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
