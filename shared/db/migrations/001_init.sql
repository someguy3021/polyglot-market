-- 001_init.sql — полная схема маркетплейса (фича 02).
-- Схема общая для Laravel и NestJS: оба ORM только маппят её (ADR-002).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Роли и статусы
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'moderator', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'pending_moderation', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('new', 'paid', 'shipped', 'done', 'cancelled');
CREATE TYPE promo_type AS ENUM ('percent', 'fixed');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password_hash text NOT NULL,
  name          text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  role          user_role NOT NULL DEFAULT 'buyer',
  blocked       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Профиль продавца (магазин) — есть у пользователей с role='seller'
CREATE TABLE seller_profiles (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_name   text NOT NULL UNIQUE CHECK (length(btrim(shop_name)) BETWEEN 2 AND 100),
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name       text NOT NULL,
  parent_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id      uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title            text NOT NULL CHECK (length(btrim(title)) BETWEEN 2 AND 200),
  slug             text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  description      text NOT NULL DEFAULT '',
  price            numeric(10,2) NOT NULL CHECK (price > 0),
  stock            integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status           product_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_rejection_requires_reason
    CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL)
);
CREATE INDEX products_catalog_idx ON products (status, category_id, price);
CREATE INDEX products_seller_idx ON products (seller_id, status);
CREATE INDEX products_title_trgm_idx ON products
  USING gin ((lower(title)) gin_trgm_ops);

CREATE TABLE product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key        text NOT NULL UNIQUE,       -- ключ объекта в S3/MinIO
  thumb_key  text,                       -- ключ превью
  is_primary boolean NOT NULL DEFAULT false,
  sort       integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_one_primary UNIQUE (product_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX product_images_product_idx ON product_images (product_id, sort);

-- Корзины: гостевая по token, аккаунтная по user_id. Одна активная корзина на владельца.
CREATE TABLE carts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  converted  boolean NOT NULL DEFAULT false,   -- заказ оформлен
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_owner CHECK (user_id IS NOT NULL OR token IS NOT NULL)
);

CREATE TABLE cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE promo_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{3,40}$'),
  type         promo_type NOT NULL,
  value        numeric(10,2) NOT NULL CHECK (value > 0),
  min_subtotal numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_uses     integer CHECK (max_uses IS NULL OR max_uses > 0),
  used_count   integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at   timestamptz,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promo_percent_range CHECK (type <> 'percent' OR value <= 100)
);

CREATE TABLE shipping_methods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9-]+$'),
  name       text NOT NULL,
  price      numeric(10,2) NOT NULL CHECK (price >= 0),
  eta_days   integer NOT NULL CHECK (eta_days BETWEEN 0 AND 60),
  active     boolean NOT NULL DEFAULT true
);

CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status             order_status NOT NULL DEFAULT 'new',
  subtotal           numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount           numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_price     numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_price >= 0),
  total              numeric(10,2) NOT NULL CHECK (total >= 0),
  promo_code_id      uuid REFERENCES promo_codes(id) ON DELETE SET NULL,
  shipping_method_id uuid NOT NULL REFERENCES shipping_methods(id) ON DELETE RESTRICT,
  shipping_address   jsonb NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_total CHECK (total = subtotal - discount + shipping_price)
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);

-- Снапшоты позиций: цена и название фиксируются на момент заказа
CREATE TABLE order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id  uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title      text NOT NULL,
  price      numeric(10,2) NOT NULL CHECK (price > 0),
  quantity   integer NOT NULL CHECK (quantity BETWEEN 1 AND 99)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
CREATE INDEX order_items_seller_idx ON order_items (seller_id);

-- Идемпотентность оформления заказа (ADR-011)
CREATE TABLE idempotency_keys (
  key        uuid NOT NULL,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, user_id)
);

-- Журнал применённых миграций (пишет Node-раннер, ADR-002)
CREATE TABLE IF NOT EXISTS schema_migrations (
  name       text PRIMARY KEY,
  checksum   text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
