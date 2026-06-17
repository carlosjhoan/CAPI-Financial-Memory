import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ExpenseEntity } from "./expense.entity";
import { PocketEntity } from "./pocket.entity";

@Entity("expense_allocations")
export class ExpenseAllocationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  expenseId: string;

  @ManyToOne(() => ExpenseEntity)
  @JoinColumn({ name: "expenseId" })
  expense: ExpenseEntity;

  @Column()
  pocketId: string;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "pocketId" })
  pocket: PocketEntity;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;
}
