/**
 * seeds/seedShoes.js
 * Run with: node server/seeds/seedShoes.js
 *
 * Populates the DB with real shoe records sourced from shoes_export.json.
 * Requires .env to be configured with MONGODB_URI (primary) and MONGODB_BACKUP_URI (backup).
 *
 * Notes:
 *  - Prices are in PHP (₱)
 *  - imageUrl is always stored as an array per the schema
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use the actual model so both primaryConn and backupConn are seeded correctly
const { PrimaryShoe, BackupShoe } = require('../models/shoeModel');

// ---------------------------------------------------------------------------
// Seed data — sourced directly from shoes_export.json
// imageUrl normalised to Array<string> throughout (schema requires array)
// ---------------------------------------------------------------------------
const SEED_DATA = [
  {
    shoe_name : 'Nike GT Cut Academy',
    brand     : 'Nike',
    color     : ['Black'],
    price     : 4000,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772552080/GTCutWhite_n5herm.png'],
    category  : 'Sports',
    gender    : 'Unisex',
  },
  {
    shoe_name : 'Way of Wade 808 5 Ultra V2 "Jay Flow"',
    brand     : 'LiNing',
    color     : ['Blue'],
    price     : 10000,
    imageUrl  : [
      'https://res.cloudinary.com/dehajzfck/image/upload/v1772724087/shoe-locker/nfxyt7r7mptgcmae5rfe.png',
      'https://res.cloudinary.com/dehajzfck/image/upload/v1773293778/shoe-locker/unq0shbjuaenlorgms50.png',
    ],
    category  : 'Sports',
    gender    : 'Unisex',
  },
  {
    shoe_name : 'Precision 7',
    brand     : 'Nike',
    color     : ['Red'],
    price     : 5500,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772724045/shoe-locker/elnwxaypyq9kgx8ctjoz.png'],
    category  : 'Sports',
    gender    : 'Unisex',
  },
  {
    shoe_name : 'Nike GT Cut 4 EP Basketball Shoes',
    brand     : 'Nike',
    color     : ['Black'],
    price     : 10895,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772723225/shoe-locker/zzcu1pqfmiv6t8szevbq.png'],
    category  : 'Sports',
    gender    : 'Mens',
  },
  {
    shoe_name : "Nike Air Force 1 '07 Men's Shoe Size 12.5 (White)",
    brand     : 'Nike',
    color     : ['White'],
    price     : 5895,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772724198/shoe-locker/rfvrv3gm7est0tlxdtkz.png'],
    category  : 'Lifestyle',
    gender    : 'Mens',
  },
  {
    shoe_name : 'Converse Chuck Taylor All Star — Black',
    brand     : 'Converse',
    color     : ['Black'],
    price     : 3520,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772723476/shoe-locker/pp1zkoqls57ed58fljcx.png'],
    category  : 'Lifestyle',
    gender    : 'Unisex',
  },
  {
    shoe_name : "New Balance 574 'Grey Navy'",
    brand     : 'New Balance',
    color     : ['Navy'],
    price     : 8800,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1772723552/shoe-locker/s0mihfoadjoprmp75e4u.png'],
    category  : 'Lifestyle',
    gender    : 'Unisex',
  },
  {
    shoe_name : "Air Force 1 Low LE 'Triple White'",
    brand     : 'Nike',
    color     : ['White'],
    price     : 4800,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1773072291/shoe-locker/bqkvy12h7wwii8jl0gky.png'],
    category  : 'Lifestyle',
    gender    : 'Womens',
  },
  {
    shoe_name : "Speedcat OG 'Black Pink'",
    brand     : 'Puma',
    color     : ['Black', 'Pink'],
    price     : 7100,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1773072482/shoe-locker/lirw7fjaodcc80urcvb0.png'],
    category  : 'Lifestyle',
    gender    : 'Mens',
  },
  {
    shoe_name : 'Adidas Yeezy Slide',
    brand     : 'Adidas',
    color     : ['Black'],
    price     : 5500,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1777210952/shoe-locker/pjdswapocqgv59c3w7y7.png'],
    category  : 'Lifestyle',
    gender    : 'Unisex',
  },
  {
    shoe_name : 'Harden Volume 9',
    brand     : 'Adidas',
    color     : ['Gold'],
    price     : 9500,
    imageUrl  : ['https://res.cloudinary.com/dehajzfck/image/upload/v1777210952/shoe-locker/pjdswapocqgv59c3w7y7.png'],
    category  : 'Sports',
    gender    : 'Mens',
  },
];

const seed = async () => {
  try {
    console.log('🔌 Connecting to databases...');

    await Promise.all([
      PrimaryShoe.db.asPromise(),
      BackupShoe.db.asPromise(),
    ]);
    console.log('✅ Connected to primary and backup\n');

    // --- Primary DB ---
    const { deletedCount: primaryDeleted } = await PrimaryShoe.deleteMany({});
    console.log(`🗑️  Primary: cleared ${primaryDeleted} existing records`);

    const primaryInserted = await PrimaryShoe.insertMany(SEED_DATA);
    console.log(`👟 Primary: inserted ${primaryInserted.length} shoe records`);

    // --- Backup DB ---
    const { deletedCount: backupDeleted } = await BackupShoe.deleteMany({});
    console.log(`🗑️  Backup:  cleared ${backupDeleted} existing records`);

    const backupInserted = await BackupShoe.insertMany(SEED_DATA);
    console.log(`👟 Backup:  inserted ${backupInserted.length} shoe records\n`);

    // --- Summary ---
    const brands     = [...new Set(SEED_DATA.map((s) => s.brand))];
    const categories = [...new Set(SEED_DATA.map((s) => s.category))];
    console.log(`Brands: ${brands.join(', ')}`);
    console.log(`Categories: ${categories.join(', ')}`);
    console.log(`Price range: $${Math.min(...SEED_DATA.map((s) => s.price))} – $${Math.max(...SEED_DATA.map((s) => s.price))}`);
    console.log('\n✨ Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await Promise.all([
      PrimaryShoe.db.close(),
      BackupShoe.db.close(),
    ]);
    process.exit(0);
  }
};

seed();