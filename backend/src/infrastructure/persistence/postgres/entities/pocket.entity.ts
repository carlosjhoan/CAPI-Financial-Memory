import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("pockets")
export class PocketEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column()
  name: string;

  @Column({ type: "varchar", length: 10, default: "goal" })
  type: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  goal: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  accumulatedAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  initialAmount: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  motivation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
