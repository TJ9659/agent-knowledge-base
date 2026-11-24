import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Paginated } from '../models/paginated';
import { User, UserChanges, UserInput } from '../models/user';

// admin only, the backend returns 403 for everyone else
@Service()
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/users';

  list(page = 1) {
    return this.http.get<Paginated<User>>(this.api, { params: { page } });
  }

  create(input: UserInput) {
    return this.http.post<User>(this.api, input);
  }

  update(id: number, changes: UserChanges) {
    return this.http.put<User>(`${this.api}/${id}`, changes);
  }

  // soft delete, sets isActive to false
  deactivate(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
