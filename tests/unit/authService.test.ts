import { AuthService, UserAlreadyExistsError, InvalidCredentialsError } from '../../src/services/authService';
import { UserRepository } from '../../src/repositories/UserRepository';

describe('AuthService', () => {
  it('registers a new user', async () => {
    const service = new AuthService(new UserRepository());
    const user = await service.register('+380501111111', 'password123');
    expect(user.phone).toBe('+380501111111');
    expect(user.id).toBeDefined();
  });

  it('throws when registering the same phone twice', async () => {
    const repo = new UserRepository();
    const service = new AuthService(repo);
    await service.register('+380502222222', 'password123');
    await expect(service.register('+380502222222', 'password123')).rejects.toThrow(UserAlreadyExistsError);
  });

  it('logs in with correct credentials', async () => {
    const repo = new UserRepository();
    const service = new AuthService(repo);
    await service.register('+380503333333', 'password123');
    const result = await service.login('+380503333333', 'password123');
    expect(result.token).toBeDefined();
  });

  it('throws when logging in with wrong password', async () => {
    const repo = new UserRepository();
    const service = new AuthService(repo);
    await service.register('+380504444444', 'password123');
    await expect(service.login('+380504444444', 'wrongpassword')).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws when logging in with unknown phone', async () => {
    const service = new AuthService(new UserRepository());
    await expect(service.login('+380509999999', 'whatever')).rejects.toThrow(InvalidCredentialsError);
  });
});