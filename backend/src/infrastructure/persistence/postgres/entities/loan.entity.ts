import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("loans")
export class LoanEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  initialAmount: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  interestRate: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  installment: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  remainingAmount: number;

  @Column()
  debtor: string;

  @Column({ type: "date" })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
