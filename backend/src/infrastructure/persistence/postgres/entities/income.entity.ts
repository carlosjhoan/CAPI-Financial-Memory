import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { IncomeAllocationEntity } from "./income-allocation.entity";

@Entity("incomes")
export class IncomeEntity {
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

  @OneToMany(() => IncomeAllocationEntity, (allocation) => allocation.income)
  allocations: IncomeAllocationEntity[];
}
