import { hash } from 'bcryptjs';

import { GetBalanceUseCase } from './GetBalanceUseCase';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';
import { AppError } from '../../../../shared/errors/AppError';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;
let newUser: ICreateUserDTO;

describe('Get Balance', () => {
  beforeAll(async () => {
    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    }
  })

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
  })

  it('should be able to show balance from user', async () => {
    await inMemoryUsersRepository.create(newUser);

    const user = await inMemoryUsersRepository.findByEmail(newUser.email);

    let userId = user?.id;

    if (!userId) {
      userId = 'not-valid-id'
    }

    const response = await getBalanceUseCase.execute({ user_id: userId });

    expect(response).toHaveProperty('statement');
    expect(response).toHaveProperty('balance');
    expect(response.balance).toBe(0);
  })

  it('should not be able to get statements from not founded user', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({ user_id: 'not-valid-id' });
    }).rejects.toBeInstanceOf(AppError);
  })
})