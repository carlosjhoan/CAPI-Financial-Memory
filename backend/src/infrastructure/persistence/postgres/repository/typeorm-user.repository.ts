import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../../domain/entities/user.entity";
import { UserRepository } from "../../../../domain/repositories/user.repository";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private toDomain(entity: UserEntity): User {
    const user = new User(
      entity.email,
      entity.name,
      entity.provider,
      entity.id,
    );
    user.isActive = entity.isActive;
    return user;
  }

  private toEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.email = domain.email;
    entity.name = domain.name;
    entity.provider = domain.provider;
    entity.isActive = domain.isActive;

    return entity;
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    // Si es un usuario nuevo sin ID, no incluir el campo para que TypeORM genere UUID
    if (!user.id) {
      delete (entity as any).id;
    }
    const savedEntity = await this.userRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async saveWithPassword(user: User, password: string): Promise<User> {
    const entity = this.toEntity(user);
    entity.password = password;
    if (!user.id) {
      delete (entity as any).id;
    }
    const savedEntity = await this.userRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { googleId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<{ user: User; password: string } | null> {
    const entity = await this.userRepository.findOne({ where: { email } });
    if (!entity || !entity.password) {
      return null;
    }
    return {
      user: this.toDomain(entity),
      password: entity.password,
    };
  }

  async update(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const updatedEntity = await this.userRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
