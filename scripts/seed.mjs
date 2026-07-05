// One-time / re-runnable demo data seeder. Uses firebase-admin with a
// service account key, so it writes directly and bypasses firestore.rules
// entirely (unlike the two apps, which always go through the rules).
//
// Setup:
//   1. Firebase Console > Project settings > Service accounts >
//      "Generate new private key" -> save as scripts/serviceAccountKey.json
//      (already gitignored).
//   2. cd scripts && npm install
//   3. npm run seed
//
// Safe to re-run: categories/products are upserted by a stable slug id, and
// the shop doc is merged, so re-running just refreshes the same records
// instead of duplicating them.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  console.error(
    `Missing ${serviceAccountPath}.\n` +
      'Download it from Firebase Console > Project settings > Service accounts > Generate new private key.'
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const DEFAULT_SHOP_ID = 'main-shop';

const img = (seed, w = 400, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const categories = [
  { id: 'vegetables', name_en: 'Vegetables', name_hi: 'सब्जियां', icon: img('veg-cat', 120, 120), sortOrder: 0 },
  { id: 'fruits', name_en: 'Fruits', name_hi: 'फल', icon: img('fruit-cat', 120, 120), sortOrder: 1 },
  { id: 'daily', name_en: 'Daily Essentials', name_hi: 'रोज़ की ज़रूरतें', icon: img('daily-cat', 120, 120), sortOrder: 2 },
  { id: 'staples', name_en: 'Grocery & Staples', name_hi: 'किराना', icon: img('staples-cat', 120, 120), sortOrder: 3 },
  { id: 'beverages', name_en: 'Beverages', name_hi: 'पेय पदार्थ', icon: img('bev-cat', 120, 120), sortOrder: 4 },
];

const products = [
  // Vegetables
  p('onion', 'vegetables', 'Onion', 'प्याज़', 30, 'kg', { isDailyItem: true }),
  p('tomato', 'vegetables', 'Tomato', 'टमाटर', 25, 'kg', { isDailyItem: true }),
  p('potato', 'vegetables', 'Potato', 'आलू', 22, 'kg', { isDailyItem: true }),
  p('spinach', 'vegetables', 'Spinach', 'पालक', 15, 'pack'),
  p('cauliflower', 'vegetables', 'Cauliflower', 'फूलगोभी', 20, 'piece'),
  p('carrot', 'vegetables', 'Carrot', 'गाजर', 35, 'kg'),
  // Fruits
  p('banana', 'fruits', 'Banana', 'केला', 50, 'dozen', { isFeatured: true }),
  p('apple', 'fruits', 'Apple', 'सेब', 150, 'kg', { isFeatured: true }),
  p('papaya', 'fruits', 'Papaya', 'पपीता', 40, 'piece'),
  p('mango', 'fruits', 'Mango', 'आम', 90, 'kg', { isFeatured: true }),
  // Daily Essentials
  p('milk', 'daily', 'Milk 1L', 'दूध 1 लीटर', 32, 'litre', { isDailyItem: true, isFeatured: true }),
  p('bread', 'daily', 'Bread', 'ब्रेड', 40, 'pack', { isDailyItem: true }),
  p('eggs', 'daily', 'Eggs', 'अंडे', 70, 'dozen', { isDailyItem: true }),
  p('curd', 'daily', 'Curd 400g', 'दही 400 ग्राम', 35, 'pack', { isDailyItem: true }),
  p('paneer', 'daily', 'Paneer 200g', 'पनीर 200 ग्राम', 80, 'pack'),
  // Grocery & Staples
  p('rice', 'staples', 'Rice 5kg', 'चावल 5 किलो', 300, 'pack'),
  p('atta', 'staples', 'Wheat Atta 5kg', 'गेहूं आटा 5 किलो', 250, 'pack'),
  p('toor-dal', 'staples', 'Toor Dal 1kg', 'तूर दाल 1 किलो', 140, 'kg'),
  p('sugar', 'staples', 'Sugar 1kg', 'चीनी 1 किलो', 45, 'kg'),
  p('cooking-oil', 'staples', 'Cooking Oil 1L', 'खाना पकाने का तेल 1 लीटर', 150, 'litre'),
  p('salt', 'staples', 'Salt 1kg', 'नमक 1 किलो', 20, 'kg'),
  // Beverages
  p('tea', 'beverages', 'Tea Powder 250g', 'चाय पत्ती 250 ग्राम', 120, 'pack'),
  p('coffee', 'beverages', 'Coffee 200g', 'कॉफ़ी 200 ग्राम', 180, 'pack'),
  p('soft-drink', 'beverages', 'Soft Drink 750ml', 'कोल्ड ड्रिंक 750 मि.ली.', 45, 'pack'),
];

function p(id, categoryId, name_en, name_hi, price, unit, extra = {}) {
  return {
    id,
    categoryId,
    name_en,
    name_hi,
    description_en: '',
    description_hi: '',
    price,
    unit,
    imageUrl: img(id),
    isAvailable: true,
    isDailyItem: false,
    isFeatured: false,
    ...extra,
  };
}

async function seed() {
  const batch = db.batch();

  batch.set(
    db.collection('shops').doc(DEFAULT_SHOP_ID),
    {
      shopName: 'Sharma General Store',
      ownerName: 'Shop Owner',
      ownerPhone: '+919999999999',
      ownerWhatsapp: '+919999999999',
      address: 'Update this in the owner app > Shop Settings',
      upiId: 'shopowner@upi',
      isOpen: true,
      deliveryRadiusKm: 3,
      minOrderAmount: 100,
      openingHours: { open: '09:00', close: '21:00' },
    },
    { merge: true }
  );

  for (const category of categories) {
    const { id, ...data } = category;
    batch.set(db.collection('categories').doc(id), { ...data, shopId: DEFAULT_SHOP_ID }, { merge: true });
  }

  const now = Date.now();
  for (const product of products) {
    const { id, ...data } = product;
    batch.set(
      db.collection('products').doc(id),
      { ...data, shopId: DEFAULT_SHOP_ID, createdAt: now, updatedAt: now },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`Seeded 1 shop, ${categories.length} categories, ${products.length} products.`);
  console.log('Edit the shop phone/UPI/address for real via the owner app > Shop Settings screen.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
