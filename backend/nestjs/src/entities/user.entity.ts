import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

// Маппинг общей таблицы users (ADR-002). synchronize запрещён.
@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "enum", enumName: "user_role", enum: ["buyer", "seller", "moderator", "admin"] })
  role!: "buyer" | "seller" | "moderator" | "admin";

  @Column({ type: "boolean", default: false })
  blocked!: boolean;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne("SellerProfileEntity", "user")
  sellerProfile?: unknown;
}
