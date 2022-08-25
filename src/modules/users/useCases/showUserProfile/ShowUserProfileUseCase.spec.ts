import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';

import { AppError } from "../../../../shared/errors/AppError";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ShowUserProfileUseCase } from './ShowUserProfileUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;
let newUser: ICreateUserDTO;

describe('Show User Profile', () => {
  beforeAll(async () => {
    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    }
  })

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
  })

  it('should be able to show authenticated user profile', async () => {
    await inMemoryUsersRepository.create(newUser);

    const user = await inMemoryUsersRepository.findByEmail(newUser.email);

    let userId = user?.id;

    if (!userId) {
      userId = 'not-valid-id'
    }

    const response = await showUserProfileUseCase.execute(userId);

    expect(response).toHaveProperty('id');
    expect(response.email).toEqual(newUser.email);
  })

  it('should not be able to show profile of a non user', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute('not-valid-id');
    }).rejects.toBeInstanceOf(AppError)
  })
})