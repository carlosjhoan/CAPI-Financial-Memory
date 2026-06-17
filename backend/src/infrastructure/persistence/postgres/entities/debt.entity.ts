import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("debts")
export class DebtEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  initialAmount: number;

  @Column()
  lender: string;

  @Column()
  months: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  installAmount: number;

  @Column({ default: 0 })
  payments: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  remainingAmount: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  reason: string;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "date", nullable: true })
  lastPaymentDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
