import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("deposits")
export class DepositEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  pocketId: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "varchar", length: 200, nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;
}
