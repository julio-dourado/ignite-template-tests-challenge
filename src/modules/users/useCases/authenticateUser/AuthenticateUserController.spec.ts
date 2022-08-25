import { Connection, createConnection, Repository } from "typeorm"
import request from 'supertest';
import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';

import { app } from "../../../../app";
import authConfig from '../../../../config/auth';

import { User } from "../../entities/User";

let connection: Connection;
let usersRepository: Repository<User>;
let user: User;

describe('Authenticate User', () => {
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
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to authenticate an user', async () => {
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: user.email,
        password: '123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toEqual(user.email);
    expect(verify(response.body.token, authConfig.jwt.secret));
  });

  it('should not be able to authenticate with non existing user', async () => {
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'non-existent-user@email.com',
        password: 'not-valid-pass'
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to authenticate with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: user.email,
        password: 'wrong-password'
      });

    expect(response.status).toBe(401);
  });
})