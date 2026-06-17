import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("login_attempts")
export class LoginAttemptEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ nullable: true })
  ip: string;

  @Column()
  success: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
