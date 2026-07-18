import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../utils/jwt';
import { DomainError } from '../types';

const SALT_ROUNDS = 10;

export class UserAlreadyExistsError extends DomainError {
  constructor() {
    super('A user with this phone number is already registered', 'USER_ALREADY_EXISTS');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid phone number or password', 'INVALID_CREDENTIALS');
  }
}

export class AuthService {
  constructor(private users: UserRepository) {}

  async register(phone: string, password: string): Promise<{ id: string; phone: string }> {
    if (this.users.findByPhone(phone)) {
      throw new UserAlreadyExistsError();
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.users.create(phone, passwordHash);
    return { id: user.id, phone: user.phone };
  }

  async login(phone: string, password: string): Promise<{ token: string }> {
    const user = this.users.findByPhone(phone);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    const token = signToken({ sub: user.id, phone: user.phone });
    return { token };
  }
}
