import { User } from '../types';

export class UserRepository {
  private usersByPhone = new Map<string, User>();
  private usersById = new Map<string, User>();
  private nextId = 1;

  findByPhone(phone: string): User | null {
    return this.usersByPhone.get(phone) ?? null;
  }

  findById(id: string): User | null {
    return this.usersById.get(id) ?? null;
  }

  create(phone: string, passwordHash: string): User {
    const user: User = {
      id: `user-${this.nextId++}`,
      phone,
      passwordHash,
      createdAt: new Date()
    };
    this.usersByPhone.set(phone, user);
    this.usersById.set(user.id, user);
    return user;
  }

  clear(): void {
    this.usersByPhone.clear();
    this.usersById.clear();
    this.nextId = 1;
  }
}
