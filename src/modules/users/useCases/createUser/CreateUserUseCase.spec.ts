import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let newUser: ICreateUserDTO;

describe('Create User', () => {
  beforeAll(() => {
    newUser = {
      name: 'Name sample',
      email: 'namesample@email.com',
      password: '123'
    }
  })

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  })

  it('should be able to create an user', async () => {
    await createUserUseCase.execute(newUser);

    const createdUser = await inMemoryUsersRepository.findByEmail(newUser.email);

    expect(createdUser).toHaveProperty('id');
  })

  it('should not be able to create an user if inserted email already exists', async () => {
    await createUserUseCase.execute(newUser);

    expect(async () => {
      await createUserUseCase.execute(newUser);
    }).rejects.toBeInstanceOf(AppError)
  })
})