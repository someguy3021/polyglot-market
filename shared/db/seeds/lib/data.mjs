// Демо-данные каталога: категории, продавцы, 40 товаров (фича 02/05).
// EN-контент — витрина читается рекрутерами/скринерами в первую очередь на английском.

export const categories = [
  { slug: "electronics", name: "Electronics" },
  { slug: "clothing", name: "Clothing" },
  { slug: "home-kitchen", name: "Home & Kitchen" },
  { slug: "sports", name: "Sports & Outdoors" },
  { slug: "books", name: "Books" },
  { slug: "toys-games", name: "Toys & Games" },
  { slug: "beauty", name: "Beauty & Personal Care" },
  { slug: "office", name: "Office Supplies" },
];

// Пароль всех демо-аккаунтов: "password"
export const users = [
  { email: "buyer@demo.dev", name: "Demo Buyer", role: "buyer" },
  { email: "seller@demo.dev", name: "Nordic Gadgets", role: "seller", shop: "Nordic Gadgets", shopDescription: "Minimal electronics and everyday carry, shipped from the north." },
  { email: "seller2@demo.dev", name: "Casa Verde", role: "seller", shop: "Casa Verde", shopDescription: "Home, kitchen and plants for slow living." },
  { email: "seller3@demo.dev", name: "Page & Pine", role: "seller", shop: "Page & Pine", shopDescription: "Independent books, stationery and games." },
  { email: "moderator@demo.dev", name: "Demo Moderator", role: "moderator" },
  { email: "admin@demo.dev", name: "Demo Admin", role: "admin" },
];

// products[sellerIndex][categorySlug] — заголовки; цена/остаток/статусы генерируются детерминированно
export const products = [
  // seller 0 — Nordic Gadgets: electronics + sports
  ["electronics", "Wireless Mechanical Keyboard 65%", 129.0],
  ["electronics", "USB-C Hub 8-in-1", 49.9],
  ["electronics", "Noise-Cancelling Earbuds", 89.0],
  ["electronics", "27\" 4K IPS Monitor", 349.0],
  ["electronics", "Bluetooth Speaker Mini", 39.0],
  ["electronics", "E-Ink Tablet 10.3\"", 419.0],
  ["electronics", "Smart Watch Titanium", 229.0],
  ["sports", "Trail Running Backpack 12L", 74.5],
  ["sports", "Insulated Water Bottle 750ml", 24.9],
  ["sports", "Yoga Mat Cork 6mm", 42.0],
  ["sports", "Camping Stove Titanium", 89.9],
  ["sports", "Trekking Poles Carbon", 109.0],
  ["sports", "Fitness Tracker Band", 59.0],
  // seller 1 — Casa Verde: home + beauty
  ["home-kitchen", "Ceramic Pour-Over Set", 58.0],
  ["home-kitchen", "Linen Apron Natural", 32.0],
  ["home-kitchen", "Cast Iron Skillet 26cm", 65.0],
  ["home-kitchen", "Bamboo Cutting Board XL", 28.5],
  ["home-kitchen", "Scented Soy Candle Cedar", 19.9],
  ["home-kitchen", "Stoneware Dinner Set 12pc", 119.0],
  ["home-kitchen", "Cold Brew Carafe 1L", 26.0],
  ["beauty", "Face Serum Vitamin C", 34.0],
  ["beauty", "Solid Shampoo Bar Set", 18.5],
  ["beauty", "Bamboo Toothbrush 4-pack", 12.0],
  ["beauty", "Shea Body Butter 200ml", 21.9],
  ["beauty", "Konjac Facial Sponge 2-pack", 9.9],
  // seller 2 — Page & Pine: books, toys, office, clothing
  ["books", "Atlas of Remote Islands", 28.0],
  ["books", "The Design of Everyday Things", 19.5],
  ["books", "Cookbook: One Pan Seasons", 32.0],
  ["books", "Field Notes: Birdwatching", 24.0],
  ["toys-games", "Wooden Puzzle Map of Europe", 36.0],
  ["toys-games", "Strategy Board Game: Caravan", 44.9],
  ["toys-games", "Watercolor Kit for Kids", 27.0],
  ["office", "Dot Grid Notebook A5 3-pack", 22.0],
  ["office", "Fountain Pen EF Nib", 48.0],
  ["office", "Desk Organizer Walnut", 39.9],
  ["office", "Washi Tape Set 10pc", 14.5],
  ["clothing", "Merino Wool Beanie", 29.0],
  ["clothing", "Organic Cotton Tee", 25.0],
  ["clothing", "Hiking Socks 3-pack", 21.0],
  ["clothing", "Canvas Tote Bag Heavy", 18.0],
];

// Особые статусы для демонстрации модерации (по slug-порядку генерации)
export const statusOverrides = [
  { index: 4, status: "pending_moderation" },
  { index: 11, status: "pending_moderation" },
  { index: 22, status: "pending_moderation" },
  { index: 5, status: "draft" },
  { index: 30, status: "draft" },
  { index: 17, status: "rejected", reason: "Product photos do not match the described item. Please re-upload and resubmit." },
];

export const promoCodes = [
  { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 0, expiresAt: null, maxUses: null },
  { code: "SAVE20FIX", type: "fixed", value: 20, minSubtotal: 50, expiresAt: null, maxUses: null },
  { code: "EXPIRED10", type: "percent", value: 10, minSubtotal: 0, expiresAt: "2026-01-01T00:00:00Z", maxUses: null },
  { code: "MAXEDOUT", type: "percent", value: 15, minSubtotal: 0, expiresAt: null, maxUses: 5, usedCount: 5 },
];

export const shippingMethods = [
  { code: "pickup", name: "Pickup point", price: 0, etaDays: 1 },
  { code: "standard", name: "Standard delivery", price: 4.99, etaDays: 5 },
  { code: "express", name: "Express courier", price: 14.99, etaDays: 2 },
];
