const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to SQLite database
const dbPath = path.resolve(__dirname, "optom.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database " + dbPath + ": " + err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

function tableInfo(table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function ensureColumn(table, colName, colDDL) {
  const info = await tableInfo(table);
  const has = info.some((c) => c.name === colName);
  if (has) return;

  await run(`ALTER TABLE ${table} ADD COLUMN ${colDDL}`);
  console.log(`✅ Added column ${table}.${colName}`);
}

async function migrate() {
  // Base tables (old schema)
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      productId TEXT,
      productName TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (productId) REFERENCES products (id)
    )
  `);

  // ✅ Add new columns (SEQUENCE!)
  await ensureColumn("products", "acceptancePrice", "acceptancePrice REAL NOT NULL DEFAULT 0");
  await ensureColumn("products", "salePrice", "salePrice REAL NOT NULL DEFAULT 0");
  await ensureColumn("transactions", "costPrice", "costPrice REAL DEFAULT NULL");

  // ✅ Backfill existing rows safely (now columns exist!)
  await run(`
    UPDATE products
    SET
      acceptancePrice = CASE WHEN acceptancePrice = 0 THEN price ELSE acceptancePrice END,
      salePrice = CASE WHEN salePrice = 0 THEN price ELSE salePrice END
  `);

  // ✅ Seed if empty
  const row = await get("SELECT COUNT(1) as cnt FROM products");
  if (row && row.cnt === 0) {
    console.log("Seeding initial products...");

    const now = Date.now();
    await run(
      `INSERT INTO products (id, name, price, stock, acceptancePrice, salePrice) VALUES (?,?,?,?,?,?)`,
      [`${now}-1`, "Rim 52", 50000, 10, 42000, 50000]
    );
    await run(
      `INSERT INTO products (id, name, price, stock, acceptancePrice, salePrice) VALUES (?,?,?,?,?,?)`,
      [`${now}-2`, "Lenses - Single Vision", 120000, 5, 95000, 120000]
    );
    await run(
      `INSERT INTO products (id, name, price, stock, acceptancePrice, salePrice) VALUES (?,?,?,?,?,?)`,
      [`${now}-3`, "Cleaning Solution", 20000, 15, 14000, 20000]
    );
  }

  console.log("✅ DB migration ready.");
}

// Run migrations on startup (and crash clearly if migration fails)
migrate().catch((e) => {
  console.error("❌ DB migration failed:", e);
  process.exit(1);
});

module.exports = db;
