// Сиды: демо-аккаунты всех ролей, категории, 40 товаров с картинками в S3,
// промокоды (включая негативные кейсы), доставка, пара заказов (фича 02, 05).
// Запуск: pnpm db:seed (идемпотентно) / pnpm db:seed --force (пересидировать).
import { join } from "node:path";
import bcrypt from "bcryptjs";
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { config } from "../../../scripts/lib/config.mjs";
import { makePool } from "../../../scripts/lib/pg.mjs";
import { productImage } from "./lib/png.mjs";
import { categories, users, products, statusOverrides, promoCodes, shippingMethods } from "./lib/data.mjs";

const pool = makePool();
const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
});
const BUCKET = config.s3.bucket;
const DEMO_PASSWORD = "password";

console.log("seed: S3-бакет…");
await ensureBucket();

console.log("seed: очистка предыдущих данных (--force)…");
await pool.query(`
  TRUNCATE idempotency_keys, order_items, orders, cart_items, carts,
           product_images, products, promo_codes, shipping_methods,
           seller_profiles, categories, users RESTART IDENTITY CASCADE
`);

console.log("seed: пользователи и магазины…");
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
const userIds = {};
for (const u of users) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
    [u.email, passwordHash, u.name, u.role],
  );
  userIds[u.email] = rows[0].id;
  if (u.shop) {
    await pool.query(`INSERT INTO seller_profiles (user_id, shop_name, description) VALUES ($1, $2, $3)`, [
      userIds[u.email],
      u.shop,
      u.shopDescription,
    ]);
  }
}

console.log("seed: категории…");
const categoryIds = {};
for (const c of categories) {
  const { rows } = await pool.query(`INSERT INTO categories (slug, name) VALUES ($1, $2) RETURNING id`, [c.slug, c.name]);
  categoryIds[c.slug] = rows[0].id;
}

console.log("seed: товары и картинки (40 шт, по 2 изображения)…");
const sellers = ["seller@demo.dev", "seller2@demo.dev", "seller3@demo.dev"];
const sellerByCategory = {
  electronics: 0,
  sports: 0,
  "home-kitchen": 1,
  beauty: 1,
  books: 2,
  "toys-games": 2,
  office: 2,
  clothing: 2,
};
const createdProducts = [];
let seedCounter = 1000;
for (const [i, [categorySlug, title, price]] of products.entries()) {
  const slug = title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const sellerEmail = sellers[sellerByCategory[categorySlug]];
  const override = statusOverrides.find((o) => o.index === i);
  const status = override?.status ?? "approved";
  const stock = 5 + ((i * 13) % 96);
  const { rows } = await pool.query(
    `INSERT INTO products (seller_id, category_id, title, slug, description, price, stock, status, rejection_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      userIds[sellerEmail],
      categoryIds[categorySlug],
      title,
      slug,
      `${title} — demo product for the Polyglot Market showcase. Category: ${categorySlug}.`,
      price.toFixed(2),
      status === "draft" ? 0 : stock,
      status,
      override?.reason ?? null,
    ],
  );
  const productId = rows[0].id;
  createdProducts.push({ id: productId, title, price, slug, categorySlug });
  await uploadProductImage(productId, seedCounter++, 640, 480, "main.png", true);
  await uploadProductImage(productId, seedCounter++, 320, 240, "thumb.png", false);
}

console.log("seed: промокоды и доставка…");
for (const p of promoCodes) {
  await pool.query(
    `INSERT INTO promo_codes (code, type, value, min_subtotal, max_uses, used_count, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [p.code, p.type, p.value.toFixed(2), p.minSubtotal.toFixed(2), p.maxUses, p.usedCount ?? 0, p.expiresAt],
  );
}
const shippingIds = {};
for (const s of shippingMethods) {
  const { rows } = await pool.query(
    `INSERT INTO shipping_methods (code, name, price, eta_days) VALUES ($1, $2, $3, $4) RETURNING id`,
    [s.code, s.name, s.price.toFixed(2), s.etaDays],
  );
  shippingIds[s.code] = rows[0].id;
}

console.log("seed: демо-заказы покупателя…");
const buyerId = userIds["buyer@demo.dev"];
await createDemoOrder(buyerId, "new", "pickup", "WELCOME10", [createdProducts[0], createdProducts[2]], [
  { line1: "Demo Street 1", city: "Springfield", zip: "10001", country: "US" },
]);
await createDemoOrder(buyerId, "shipped", "standard", null, [createdProducts[20], createdProducts[25], createdProducts[27]], [
  { line1: "Demo Avenue 42", city: "Shelbyville", zip: "20002", country: "US" },
]);

console.log("\x1b[32mseed: готово. Демо-аккаунты: buyer/seller/seller2/seller3/moderator/admin @demo.dev, пароль: password\x1b[0m");
await pool.end();

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return;
  } catch {
    /* не существует — создадим */
  }
  await s3.send(new CreateBucketCommand({ Bucket: BUCKET })).catch((e) => {
    if (e.name !== "BucketAlreadyOwnedByYou" && e.name !== "BucketAlreadyExists") throw e;
  });
}

async function uploadProductImage(productId, seed, width, height, name, isPrimary) {
  const key = `${productId}/${name}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: productImage(seed, width, height), ContentType: "image/png" }));
  await pool.query(
    `INSERT INTO product_images (product_id, key, thumb_key, is_primary, sort) VALUES ($1, $2, $3, $4, $5)`,
    [productId, key, isPrimary ? `${productId}/thumb.png` : null, isPrimary, isPrimary ? 0 : 1],
  );
}

async function createDemoOrder(userId, status, shippingCode, promoCode, items, address) {
  const subtotal = items.reduce((acc, p) => acc + p.price, 0);
  let discount = 0;
  let promoId = null;
  if (promoCode) {
    const { rows } = await pool.query(`SELECT id, type, value FROM promo_codes WHERE code = $1`, [promoCode]);
    promoId = rows[0].id;
    discount = rows[0].type === "percent" ? (subtotal * Number(rows[0].value)) / 100 : Number(rows[0].value);
  }
  const { rows: sm } = await pool.query(`SELECT id, price FROM shipping_methods WHERE code = $1`, [shippingCode]);
  const shippingPrice = Number(sm[0].price);
  const total = subtotal - discount + shippingPrice;
  const { rows: order } = await pool.query(
    `INSERT INTO orders (user_id, status, subtotal, discount, shipping_price, total, promo_code_id, shipping_method_id, shipping_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [userId, status, subtotal.toFixed(2), discount.toFixed(2), shippingPrice.toFixed(2), total.toFixed(2), promoId, sm[0].id, JSON.stringify(address[0])],
  );
  for (const p of items) {
    const { rows: prod } = await pool.query(`SELECT seller_id FROM products WHERE id = $1`, [p.id]);
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, seller_id, title, price, quantity) VALUES ($1, $2, $3, $4, $5, 1)`,
      [order[0].id, p.id, prod[0].seller_id, p.title, p.price.toFixed(2)],
    );
  }
}
