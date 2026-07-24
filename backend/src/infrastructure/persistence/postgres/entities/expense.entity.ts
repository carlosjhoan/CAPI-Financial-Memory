import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from "typeorm";
import { ExpenseAllocationEntity } from "./expense-allocation.entity";

@Entity("expenses")
export class ExpenseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ type: "date" })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isAdjustment: boolean;

  @Column({ type: "uuid", nullable: true })
  adjustedRecordId: string | null;

  @OneToMany(() => ExpenseAllocationEntity, (allocation) => allocation.expense)
  allocations: ExpenseAllocationEntity[];
}
