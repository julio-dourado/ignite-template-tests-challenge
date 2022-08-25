import { Connection, createConnection, Repository } from "typeorm"
import request from 'supertest';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';
import { app } from "../../../../app";

import { User } from "../../../users/entities/User";
import { Statement } from "../../entities/Statement";

let connection: Connection;
let usersRepository: Repository<User>;
let statementsRepository: Repository<Statement>;
let user: User;
let userId: string;
let token: string;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Get User Balance', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    statementsRepository = connection.getRepository<Statement>(Statement);
    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    });

    user = await usersRepository.save(user);

    userId = (user?.id) ? user.id : 'not-valid-id';

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });

    const statement = statementsRepository.create({
      user_id: user.id,
      amount: 100,
      description: 'Deposit Sample',
      type: 'deposit' as OperationType
    });

    await statementsRepository.save(statement);

    const statement2 = statementsRepository.create({
      user_id: user.id,
      amount: 30,
      description: 'Withdraw Sample',
      type: 'withdraw' as OperationType
    });

    await statementsRepository.save(statement2);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to get balance from user', async () => {
    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
    expect(response.body).toHaveProperty('statement');
    expect(response.body.balance).toBe(70);
  });

  it('should not be able to get statements from not founded user', async () => {
    await usersRepository.delete(userId);

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
  });
})