export interface Category {
  id: number;
  name: string;
  articleCount: number;
}

export interface CategoryStats {
  id: number;
  name: string;
  total: number;
  published: number;
  drafts: number;
}
