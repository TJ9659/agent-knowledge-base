import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  Article,
  ArticleInput,
  ArticleListItem,
  ArticleStatus,
  ImportedArticle,
} from '../models/article';
import { Paginated } from '../models/paginated';

export interface ArticleQuery {
  q?: string;
  categoryId?: number;
  status?: ArticleStatus | 'ALL';
  page?: number;
  pageSize?: number;
}

// drops empty filters so the url only has what was asked for
function toParams(query: object) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  );
}

@Service()
export class ArticleService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/articles';

  list(query: ArticleQuery = {}) {
    return this.http.get<Paginated<ArticleListItem>>(this.api, { params: toParams(query) });
  }

  mine(page = 1) {
    return this.http.get<Paginated<ArticleListItem>>(`${this.api}/mine`, { params: { page } });
  }

  get(id: number) {
    return this.http.get<Article>(`${this.api}/${id}`);
  }

  create(input: ArticleInput) {
    return this.http.post<Article>(this.api, input);
  }

  update(id: number, changes: Partial<ArticleInput>) {
    return this.http.put<Article>(`${this.api}/${id}`, changes);
  }

  importPdf(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ImportedArticle>(`${this.api}/import`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
