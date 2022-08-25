import { hash } from 'bcryptjs';

import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';
import { AppError } from '../../../../shared/errors/AppError';
import { GetStatementOperationUseCase } from './GetStatementOperationUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let newUser: ICreateUserDTO;
let userId: string;
let statementId: string;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Get Statement Operation', () => {
  beforeAll(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    }

    await inMemoryUsersRepository.create(newUser);

    const user = await inMemoryUsersRepository.findByEmail(newUser.email);

    userId = (user?.id) ? user.id : 'not-valid-id'

    const { id } = await inMemoryStatementsRepository.create({
      user_id: userId,
      amount: 100,
      description: 'Deposit Sample',
      type: 'deposit' as OperationType
    })

    statementId = (id) ? id : 'not-valid-id'
  })

  beforeEach(() => {
    getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  })

  it('should be able to show statement operation from user', async () => {
    const response = await getStatementOperationUseCase.execute({
      user_id: userId,
      statement_id: statementId
    });

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('amount');
    expect(response.amount).toBe(100);
  })

  it('should not be able to show statement operation from a non-existent user', async () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: 'not-valid-id',
        statement_id: statementId
      });
    }).rejects.toBeInstanceOf(AppError);
  })

  it('should not be able to show statement from a non-existent operation', async () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: userId,
        statement_id: 'not-valid-id'
      });
    }).rejects.toBeInstanceOf(AppError);
  })
})