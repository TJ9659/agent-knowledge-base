import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { AskAnswer } from '../models/ask';

@Service()
export class AskService {
  private readonly http = inject(HttpClient);

  ask(question: string) {
    return this.http.post<AskAnswer>('/api/ask', { question });
  }
}
