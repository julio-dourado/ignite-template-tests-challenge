import { Connection, createConnection, Repository } from "typeorm"
import request from 'supertest';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';
import { app } from "../../../../app";

import { User } from "../../../users/entities/User";

let connection: Connection;
let usersRepository: Repository<User>;
let user: User;
let userId: string;
let token: string;

describe('Create Statement', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: 'Name sample',
      email: 'namesample@email.com',
      password: await hash('123', 8)
    });

    user = await usersRepository.save(user);

    userId = (user?.id) ? user.id : 'not-valid-id'

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to create a deposit statement', async () => {
    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 100.50,
        description: 'Deposit Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(userId);
    expect(response.body.amount).toBe(100.50);
  });

  it('should be able to create a withdraw statement', async () => {
    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 100.10,
        description: 'Deposit Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 50.99,
        description: 'Withdraw Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(userId);
    expect(response.body.amount).toBe(50.99);
  });

  it('should not be able to create a withdraw statement without balance', async () => {
    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 5000,
        description: 'Withdraw Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a statement with an non-existent user', async () => {
    await usersRepository.delete(userId);

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 100,
        description: 'Deposit Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(404);
  });
})