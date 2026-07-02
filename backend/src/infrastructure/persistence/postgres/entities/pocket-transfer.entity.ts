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

  @Column({ nullable: true })
  sourcePocketId: string | null;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "sourcePocketId" })
  sourcePocket: PocketEntity | null;

  @Column({ nullable: true, type: "varchar" })
  sourcePocketName: string | null;

  @Column({ nullable: true })
  targetPocketId: string | null;

  @ManyToOne(() => PocketEntity)
  @JoinColumn({ name: "targetPocketId" })
  targetPocket: PocketEntity | null;

  @Column({ nullable: true, type: "varchar" })
  targetPocketName: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ type: "date" })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;
}
