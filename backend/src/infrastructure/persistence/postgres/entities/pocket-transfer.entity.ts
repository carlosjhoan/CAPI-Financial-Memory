import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PocketEntity } from "./pocket.entity";

@Entity("pocket_transfers")
export class PocketTransferEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  sourcePocketId: string;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "sourcePocketId" })
  sourcePocket: PocketEntity;

  @Column()
  targetPocketId: string;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "targetPocketId" })
  targetPocket: PocketEntity;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ type: "date" })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;
}
