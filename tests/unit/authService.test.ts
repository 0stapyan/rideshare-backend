import { AuthService, UserAlreadyExistsError, InvalidCredentialsError } from '../../src/services/authService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { verifyToken } from '../../src/utils/jwt';
import { User } from '../../src/types';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    clear: jest.fn()
  } as unknown as jest.Mocked<UserRepository>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService: register', () => {
  it('hashes the password before storing the user (never stores it in plain text)', async () => {
    // Arrange
    const userRepo = makeMockUserRepo();
    userRepo.findByPhone.mockReturnValue(null);
    userRepo.create.mockImplementation(
      (phone, passwordHash) => ({ id: 'user-1', phone, passwordHash, createdAt: new Date() } as User)
    );
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed:pw12345');
    const service = new AuthService(userRepo);

    // Act
    const result = await service.register('+380501111111', 'pw12345');

    // Assert
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('pw12345', 10);
    expect(userRepo.create).toHaveBeenCalledWith('+380501111111', 'hashed:pw12345');
    expect(result).toEqual({ id: 'user-1', phone: '+380501111111' });
  });

  it('throws UserAlreadyExistsError without hashing anything when the phone is taken', async () => {
    // Arrange
    const userRepo = makeMockUserRepo();
    userRepo.findByPhone.mockReturnValue({ id: 'existing', phone: '+380502222222', passwordHash: 'x', createdAt: new Date() });
    const service = new AuthService(userRepo);

    // Act
    const act = service.register('+380502222222', 'anyPassword');

    // Assert
    await expect(act).rejects.toThrow(UserAlreadyExistsError);
    expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
  });
});

describe('AuthService: login', () => {
  it('returns a JWT whose payload matches the authenticated user', async () => {
    // Arrange
    const userRepo = makeMockUserRepo();
    userRepo.findByPhone.mockReturnValue({
      id: 'user-7',
      phone: '+380503333333',
      passwordHash: 'hashed:correct',
      createdAt: new Date()
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    const service = new AuthService(userRepo);

    // Act
    const { token } = await service.login('+380503333333', 'correct-password');
    const payload = verifyToken(token);

    // Assert
    expect(payload.sub).toBe('user-7');
    expect(payload.phone).toBe('+380503333333');
  });

  it('throws InvalidCredentialsError when the password does not match', async () => {
    const userRepo = makeMockUserRepo();
    userRepo.findByPhone.mockReturnValue({
      id: 'user-7',
      phone: '+380503333333',
      passwordHash: 'hashed:correct',
      createdAt: new Date()
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
    const service = new AuthService(userRepo);

    const act = service.login('+380503333333', 'wrong-password');

    await expect(act).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for an unregistered phone number, without calling bcrypt', async () => {
    const userRepo = makeMockUserRepo();
    userRepo.findByPhone.mockReturnValue(null);
    const service = new AuthService(userRepo);

    const act = service.login('+380509999999', 'whatever');

    await expect(act).rejects.toThrow(InvalidCredentialsError);
    expect(mockedBcrypt.compare).not.toHaveBeenCalled();
  });
});