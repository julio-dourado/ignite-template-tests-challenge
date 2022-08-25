import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let newUser: ICreateUserDTO;

describe('Authenticate User', () => {
  beforeAll(async () => {
    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    }
  })

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  })

  it('should be able to authenticate an user', async () => {
    await inMemoryUsersRepository.create(newUser);

    const response = await authenticateUserUseCase.execute({
      email: newUser.email,
      password: '123',
    });

    expect(response).toHaveProperty('token');
    expect(response.user.email).toEqual(newUser.email);
    expect(verify(response.token, authConfig.jwt.secret));
  })

  it('should not be able to authenticate with non existing user', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: newUser.email,
        password: newUser.password,
      });
    }).rejects.toBeInstanceOf(AppError)
  })

  it('should not be able to authenticate with wrong password', async () => {
    await inMemoryUsersRepository.create(newUser);

    expect(async () => {
      await authenticateUserUseCase.execute({
        email: newUser.email,
        password: 'wrong-password',
      });
    }).rejects.toBeInstanceOf(AppError)
  })
})