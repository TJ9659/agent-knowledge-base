import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Category, CategoryStats } from '../models/category';

@Service()
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/categories';

  list() {
    return this.http.get<Category[]>(this.api);
  }

  // admin only, counts drafts too
  stats() {
    return this.http.get<CategoryStats[]>('/api/stats/categories');
  }

  create(name: string) {
    return this.http.post<Category>(this.api, { name });
  }

  rename(id: number, name: string) {
    return this.http.put<Category>(`${this.api}/${id}`, { name });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
