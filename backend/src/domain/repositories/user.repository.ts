import { User } from "../entities/user.entity";

export interface UserRepository {
  save(user: User): Promise<User>;
  saveWithPassword(user: User, password: string): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmailWithPassword(
    email: string,
  ): Promise<{ user: User; password: string } | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
