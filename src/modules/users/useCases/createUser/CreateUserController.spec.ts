import { Connection, createConnection } from "typeorm"
import request from 'supertest';
import { compare } from 'bcryptjs';

import { app } from "../../../../app";
import { User } from "../../entities/User";
import { ICreateUserDTO } from "./ICreateUserDTO";

let connection: Connection;
let newUser: ICreateUserDTO;

describe('Create User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: '123'
    }
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to create an user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send(newUser);

    const user = await connection.createQueryBuilder<User>(User, 'users')
      .where('users.email = :email', { email: newUser.email })
      .getOne()

    let userPassword = user?.password;

    if (!userPassword) {
      userPassword = 'not-valid-password'
    }

    expect(response.status).toBe(201);
    expect(user).toBeInstanceOf(User);
    expect(await compare('123', userPassword)).toBe(true);
  });

  it('should not be able to create an user if inserted email already exists', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send(newUser);

    expect(response.status).toBe(400);
  });
})