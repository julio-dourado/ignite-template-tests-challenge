import { hash } from 'bcryptjs';

import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';
import { AppError } from '../../../../shared/errors/AppError';
import { CreateStatementUseCase } from './CreateStatementUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let newUser: ICreateUserDTO;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Create Statement', () => {
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
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  })

  it('should be able to create a deposit statement', async () => {
    await inMemoryUsersRepository.create(newUser);

    const user = await inMemoryUsersRepository.findByEmail(newUser.email);

    let userId = user?.id;

    if (!userId) {
      userId = 'not-valid-id'
    }

    const response = await createStatementUseCase.execute({
      user_id: userId,
      amount: 100,
      description: 'Deposit Sample',
      type: 'deposit' as OperationType
    });

    expect(response).toHaveProperty('id');
    expect(response.user_id).toBe(userId);
  })

  it('should be able to create a withdraw statement', async () => {
    await inMemoryUsersRepository.create(newUser);

    const user = await inMemoryUsersRepository.findByEmail(newUser.email);

    let userId = user?.id;

    if (!userId) {
      userId = 'not-valid-id'
    }

    await createStatementUseCase.execute({
      user_id: userId,
      amount: 100,
      description: 'Deposit Sample',
      type: 'deposit' as OperationType
    });

    const response = await createStatementUseCase.execute({
      user_id: userId,
      amount: 50,
      description: 'Withdraw Sample',
      type: 'withdraw' as OperationType
    });

    expect(response).toHaveProperty('id');
    expect(response.user_id).toBe(userId);
  })

  it('should not be able to create a statement with an non-existent user', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: 'not-valid-id',
        amount: 100,
        description: 'Deposit Sample',
        type: 'deposit' as OperationType
      });
    }).rejects.toBeInstanceOf(AppError);
  })

  it('should not be able to create a withdraw statement without balance', async () => {
    expect(async () => {
      await inMemoryUsersRepository.create(newUser);

      const user = await inMemoryUsersRepository.findByEmail(newUser.email);

      let userId = user?.id;

      if (!userId) {
        userId = 'not-valid-id'
      }

      await createStatementUseCase.execute({
        user_id: userId,
        amount: 50,
        description: 'Withdraw Sample',
        type: 'withdraw' as OperationType
      });
    }).rejects.toBeInstanceOf(AppError);
  })
})