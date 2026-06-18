import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { LoginAttemptEntity } from "../entities/login-attempt.entity";

@Injectable()
export class TypeOrmLoginAttemptRepository {
  constructor(
    @InjectRepository(LoginAttemptEntity)
    private readonly repository: Repository<LoginAttemptEntity>,
  ) {}

  async save(attempt: {
    email: string;
    ip: string;
    success: boolean;
  }): Promise<void> {
    const entity = this.repository.create({
      email: attempt.email,
      ip: attempt.ip,
      success: attempt.success,
    });
    await this.repository.save(entity);
  }

  async countRecentFailures(email: string, since: Date): Promise<number> {
    return this.repository.count({
      where: {
        email,
        success: false,
        timestamp: MoreThan(since),
      },
    });
  }

  async clearForEmail(email: string): Promise<void> {
    await this.repository.delete({ email });
  }
}
