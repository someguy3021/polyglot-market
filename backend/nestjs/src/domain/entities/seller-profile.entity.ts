import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("seller_profiles")
export class SellerProfileEntity {
  // PK таблицы — user_id (нет суррогатного id)
  @PrimaryColumn("uuid", { name: "user_id" })
  userId!: string;

  @Column({ name: "shop_name", type: "text", unique: true })
  shopName!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserEntity, (user) => user.sellerProfile)
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
