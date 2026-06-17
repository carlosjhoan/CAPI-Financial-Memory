import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { IncomeEntity } from "./income.entity";
import { PocketEntity } from "./pocket.entity";

@Entity("income_allocations")
export class IncomeAllocationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  incomeId: string;

  @ManyToOne(() => IncomeEntity)
  @JoinColumn({ name: "incomeId" })
  income: IncomeEntity;

  @Column()
  pocketId: string;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "pocketId" })
  pocket: PocketEntity;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;
}
