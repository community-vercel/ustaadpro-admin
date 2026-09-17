#!/usr/bin/env node

/**
 * clean-database.js
 * 
 * Cleans specific tables from the ustaadpro database:
 *   - users, user_addresses, auth_otps
 *   - orders, order_items, service_reviews
 *   - payment_receipts
 *   - shop_orders, shop_order_items
 * 
 * Dashboard KPIs are computed on-the-fly from these tables,
 * so they will automatically reset to zero after cleaning.
 * 
 * Tables NOT touched:
 *   - admin_credentials, categories, subcategories, services
 *   - shop_products, home_slides, app_settings, subscriptions
 *   - providers, service_work_prices
 *   - bot_services, bot_bookings, bot_sessions, complaints
 * 
 * Usage:
 *   node scripts/clean-database.js              # interactive (asks confirmation)
 *   node scripts/clean-database.js --yes        # skip confirmation prompt
 *   node scripts/clean-database.js --dry-run    # preview without deleting
 */

const { Pool } = require('pg');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Load .env from ustaadpro_server (one directory up + server folder)
try {
  const dotenv = require('dotenv');
  const serverEnvPath = path.join(__dirname, '..', '..', 'ustaadpro_server', '.env');
  if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
    console.log(`📁 Loaded .env from: ${serverEnvPath}`);
  } else {
    dotenv.config();
  }
} catch {
  // dotenv not available, rely on process.env
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'ustaadpro_db',
      },
);

// ─── Tables to clean (in dependency-safe order) ───
// Children first, then parents. TRUNCATE CASCADE handles FKs,
// but we order them explicitly for clarity and logging.
const TABLES_TO_CLEAN = [
  // Dependent on orders + users
  'service_reviews',
  // Dependent on orders
  'order_items',
  'payment_receipts',
  // Dependent on shop_orders
  'shop_order_items',
  // Dependent on users
  'auth_otps',
  'user_addresses',
  // Parent tables
  'orders',
  'shop_orders',
  'users',
];

// ─── Parse CLI args ───
const args = process.argv.slice(2);
const SKIP_CONFIRM = args.includes('--yes') || args.includes('-y');
const DRY_RUN = args.includes('--dry-run');

function askQuestion(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function getRowCounts(client) {
  const counts = {};
  for (const table of TABLES_TO_CLEAN) {
    try {
      const result = await client.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
      counts[table] = Number(result.rows[0].cnt);
    } catch {
      counts[table] = 'N/A (table missing?)';
    }
  }
  return counts;
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║      🧹  UstaadPro Database Cleaner  🧹        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  const client = await pool.connect();

  try {
    // 1. Show current row counts
    console.log('📊 Current row counts:');
    console.log('─'.repeat(45));
    const counts = await getRowCounts(client);
    let totalRows = 0;
    for (const [table, count] of Object.entries(counts)) {
      const num = typeof count === 'number' ? count : 0;
      totalRows += num;
      console.log(`  ${table.padEnd(25)} ${String(count).padStart(8)} rows`);
    }
    console.log('─'.repeat(45));
    console.log(`  ${'TOTAL'.padEnd(25)} ${String(totalRows).padStart(8)} rows`);
    console.log('');

    // 2. Tables that will be preserved
    console.log('✅ Tables that will be PRESERVED (not touched):');
    console.log('  admin_credentials, categories, subcategories,');
    console.log('  services, service_work_prices, shop_products,');
    console.log('  home_slides, app_settings, subscriptions,');
    console.log('  providers, bot_services, bot_bookings,');
    console.log('  bot_sessions, complaints');
    console.log('');

    // 3. Dry run check
    if (DRY_RUN) {
      console.log('🔍 DRY RUN — no data will be deleted.');
      console.log('');
      console.log('The following tables will be truncated:');
      for (const table of TABLES_TO_CLEAN) {
        console.log(`  ✓ ${table}`);
      }
      console.log('');
      console.log('Dashboard KPIs will reset to zero after cleaning.');
      console.log('Run without --dry-run to execute.');
      return;
    }

    // 4. Confirmation prompt
    if (!SKIP_CONFIRM) {
      const answer = await askQuestion(
        `⚠️  This will DELETE all data from ${TABLES_TO_CLEAN.length} tables (${totalRows} rows). Type "yes" to confirm: `,
      );
      if (answer !== 'yes') {
        console.log('❌ Aborted. No data was changed.');
        return;
      }
    }

    // 5. Execute cleanup
    console.log('');
    console.log('🧹 Cleaning database...');
    console.log('');

    for (const table of TABLES_TO_CLEAN) {
      try {
        const before = counts[table];
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✅ ${table.padEnd(25)} truncated (${before} rows removed)`);
      } catch (error) {
        console.log(`  ⚠️  ${table.padEnd(25)} error: ${error.message}`);
      }
    }

    console.log('');
    console.log('─'.repeat(45));

    // 6. Verify cleanup
    console.log('');
    console.log('📊 Verifying cleanup...');
    const afterCounts = await getRowCounts(client);
    let allClean = true;
    for (const [table, count] of Object.entries(afterCounts)) {
      if (count !== 0) {
        allClean = false;
        console.log(`  ⚠️  ${table}: ${count} rows remaining`);
      }
    }

    if (allClean) {
      console.log('  ✅ All target tables are now empty!');
    }

    // 7. Show what's preserved
    console.log('');
    console.log('📦 Preserved data summary:');
    const preserved = [
      'categories', 'subcategories', 'services', 'service_work_prices',
      'shop_products', 'home_slides', 'app_settings', 'subscriptions',
      'providers', 'admin_credentials',
    ];
    for (const table of preserved) {
      try {
        const result = await client.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
        const cnt = Number(result.rows[0].cnt);
        if (cnt > 0) {
          console.log(`  ✅ ${table.padEnd(25)} ${String(cnt).padStart(6)} rows`);
        }
      } catch {
        // Table might not exist
      }
    }

    console.log('');
    console.log('🎉 Database cleanup complete!');
    console.log('   Dashboard KPIs will now show zero for orders/revenue.');
    console.log('   All services, categories, products, and settings are intact.');
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
