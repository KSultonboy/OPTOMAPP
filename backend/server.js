const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(bodyParser.json());

// ✅ request log
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

function sendError(res, status, message) {
    return res.status(status).json({ success: false, error: message });
}

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
}

// --- Products API ---
app.get("/products", (req, res) => {
    // price -> salePrice sifatida ham qaytaramiz (old clientlar uchun)
    const sql = `
    SELECT
      id,
      name,
      stock,
      price,
      acceptancePrice,
      salePrice
    FROM products
  `;
    db.all(sql, [], (err, rows) => {
        if (err) return sendError(res, 400, err.message);

        const data = rows.map((p) => ({
            ...p,
            // old client uchun:
            price: p.salePrice ?? p.price,
        }));

        res.json({ success: true, data });
    });
});

app.get("/products/:id", (req, res) => {
    const sql = `
    SELECT id, name, stock, price, acceptancePrice, salePrice
    FROM products WHERE id = ?
  `;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return sendError(res, 400, err.message);
        if (!row) return sendError(res, 404, "Product not found");

        res.json({
            success: true,
            data: {
                ...row,
                price: row.salePrice ?? row.price,
            },
        });
    });
});

// Create product: name, acceptancePrice, salePrice (price optional legacy)
app.post("/products", (req, res) => {
    const { name, acceptancePrice, salePrice, price } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return sendError(res, 400, "Invalid name");
    }

    const ap = toNumber(acceptancePrice);
    const sp = toNumber(salePrice);

    // legacy: price yuborsa, sp sifatida qabul qilamiz
    const legacyPrice = toNumber(price);

    const finalSalePrice = Number.isFinite(sp) && sp > 0 ? sp : (Number.isFinite(legacyPrice) ? legacyPrice : NaN);
    const finalAcceptancePrice = Number.isFinite(ap) && ap > 0 ? ap : finalSalePrice;

    if (!Number.isFinite(finalSalePrice) || finalSalePrice <= 0) {
        return sendError(res, 400, "Invalid salePrice");
    }
    if (!Number.isFinite(finalAcceptancePrice) || finalAcceptancePrice <= 0) {
        return sendError(res, 400, "Invalid acceptancePrice");
    }

    const id = Date.now().toString();
    const stock = 0;

    // price ustuni — legacy, salePrice’ni saqlab turamiz
    const sql = `
    INSERT INTO products (id, name, price, stock, acceptancePrice, salePrice)
    VALUES (?,?,?,?,?,?)
  `;
    const params = [id, name.trim(), finalSalePrice, stock, finalAcceptancePrice, finalSalePrice];

    db.run(sql, params, function (err) {
        if (err) return sendError(res, 400, err.message);
        res.json({
            success: true,
            data: {
                id,
                name: name.trim(),
                stock,
                acceptancePrice: finalAcceptancePrice,
                salePrice: finalSalePrice,
                price: finalSalePrice, // legacy
            },
        });
    });
});

app.delete("/products/:id", (req, res) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) return sendError(res, 400, err.message);
        res.json({ success: true, message: "deleted", changes: this.changes });
    });
});

// Update product: name, acceptancePrice, salePrice, stock (price -> salePrice legacy)
app.put("/products/:id", (req, res) => {
    const id = req.params.id;
    const { name, acceptancePrice, salePrice, stock, price } = req.body;

    if (name !== undefined && typeof name !== "string") return sendError(res, 400, "Invalid name");
    if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0))
        return sendError(res, 400, "Invalid stock");

    // legacy price -> salePrice
    const legacyPrice = price !== undefined ? toNumber(price) : undefined;

    const ap = acceptancePrice !== undefined ? toNumber(acceptancePrice) : undefined;
    const sp = salePrice !== undefined ? toNumber(salePrice) : (legacyPrice !== undefined ? legacyPrice : undefined);

    if (ap !== undefined && (!Number.isFinite(ap) || ap <= 0)) return sendError(res, 400, "Invalid acceptancePrice");
    if (sp !== undefined && (!Number.isFinite(sp) || sp <= 0)) return sendError(res, 400, "Invalid salePrice");

    db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
        if (err) return sendError(res, 400, err.message);
        if (!product) return sendError(res, 404, "Product not found");

        const newName = name !== undefined ? name.trim() : product.name;
        const newStock = stock !== undefined ? Number(stock) : product.stock;

        const newAcceptancePrice = ap !== undefined ? ap : product.acceptancePrice;
        const newSalePrice = sp !== undefined ? sp : product.salePrice;

        // price = salePrice legacy
        db.run(
            "UPDATE products SET name = ?, stock = ?, acceptancePrice = ?, salePrice = ?, price = ? WHERE id = ?",
            [newName, newStock, newAcceptancePrice, newSalePrice, newSalePrice, id],
            function (err) {
                if (err) return sendError(res, 400, err.message);
                res.json({
                    success: true,
                    data: {
                        id,
                        name: newName,
                        stock: newStock,
                        acceptancePrice: newAcceptancePrice,
                        salePrice: newSalePrice,
                        price: newSalePrice,
                    },
                });
            }
        );
    });
});

// --- Transactions API ---
app.get("/transactions", (req, res) => {
    const sql = "SELECT * FROM transactions ORDER BY date DESC";
    db.all(sql, [], (err, rows) => {
        if (err) return sendError(res, 400, err.message);
        res.json({ success: true, data: rows });
    });
});

// Acceptance: default price = product.acceptancePrice
app.post("/transactions/acceptance", (req, res) => {
    const { productId, quantity, price, notes } = req.body;

    const qty = toNumber(quantity);
    if (!productId) return sendError(res, 400, "productId is required");
    if (!Number.isFinite(qty) || qty <= 0) return sendError(res, 400, "Invalid quantity");

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) return sendError(res, 400, err.message);
        if (!product) return sendError(res, 404, "Product not found");

        const priceNumRaw = price !== undefined ? toNumber(price) : product.acceptancePrice;
        const priceNum = Number.isFinite(priceNumRaw) && priceNumRaw > 0 ? priceNumRaw : product.acceptancePrice;

        if (!Number.isFinite(priceNum) || priceNum <= 0) return sendError(res, 400, "Invalid price");

        const transactionId = Date.now().toString();
        const date = new Date().toISOString();
        const total = qty * priceNum;
        const newStock = product.stock + qty;

        // Qabul bo'lganda product.acceptancePrice'ni oxirgi narxga yangilaymiz
        db.serialize(() => {
            db.run(
                "UPDATE products SET stock = ?, acceptancePrice = ? WHERE id = ?",
                [newStock, priceNum, productId]
            );

            db.run(
                `INSERT INTO transactions (id, type, productId, productName, quantity, price, total, date, notes, costPrice)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [transactionId, "acceptance", productId, product.name, qty, priceNum, total, date, notes, null],
                function (err) {
                    if (err) return sendError(res, 400, err.message);
                    res.json({
                        success: true,
                        data: {
                            id: transactionId,
                            type: "acceptance",
                            productId,
                            productName: product.name,
                            quantity: qty,
                            price: priceNum,
                            total,
                            date,
                            notes,
                            costPrice: null,
                        },
                    });
                }
            );
        });
    });
});

// Sale: default price = product.salePrice, costPrice = product.acceptancePrice
app.post("/transactions/sale", (req, res) => {
    const { productId, quantity, price, notes } = req.body;

    const qty = toNumber(quantity);
    if (!productId) return sendError(res, 400, "productId is required");
    if (!Number.isFinite(qty) || qty <= 0) return sendError(res, 400, "Invalid quantity");

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) return sendError(res, 400, err.message);
        if (!product) return sendError(res, 404, "Product not found");
        if (product.stock < qty) return sendError(res, 400, "Insufficient stock");

        const priceNumRaw = price !== undefined ? toNumber(price) : product.salePrice;
        const priceNum = Number.isFinite(priceNumRaw) && priceNumRaw > 0 ? priceNumRaw : product.salePrice;

        if (!Number.isFinite(priceNum) || priceNum <= 0) return sendError(res, 400, "Invalid price");

        const costPrice = Number.isFinite(product.acceptancePrice) ? product.acceptancePrice : null;

        const transactionId = Date.now().toString();
        const date = new Date().toISOString();
        const total = qty * priceNum;
        const newStock = product.stock - qty;

        db.serialize(() => {
            db.run("UPDATE products SET stock = ? WHERE id = ?", [newStock, productId]);

            db.run(
                `INSERT INTO transactions (id, type, productId, productName, quantity, price, total, date, notes, costPrice)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [transactionId, "sale", productId, product.name, qty, priceNum, total, date, notes, costPrice],
                function (err) {
                    if (err) return sendError(res, 400, err.message);
                    res.json({
                        success: true,
                        data: {
                            id: transactionId,
                            type: "sale",
                            productId,
                            productName: product.name,
                            quantity: qty,
                            price: priceNum,
                            total,
                            date,
                            notes,
                            costPrice,
                        },
                    });
                }
            );
        });
    });
});

app.delete("/transactions/:id", (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM transactions WHERE id = ?", [id], (err, tx) => {
        if (err) return sendError(res, 400, err.message);
        if (!tx) return sendError(res, 404, "Transaction not found");

        db.get("SELECT * FROM products WHERE id = ?", [tx.productId], (err, product) => {
            if (err) return sendError(res, 400, err.message);
            if (!product) return sendError(res, 404, "Product not found");

            let newStock = product.stock;
            if (tx.type === "sale") newStock = product.stock + tx.quantity;
            else if (tx.type === "acceptance") {
                newStock = product.stock - tx.quantity;
                if (newStock < 0) return sendError(res, 400, "Cannot delete acceptance; insufficient stock to revert");
            }

            db.serialize(() => {
                db.run("DELETE FROM transactions WHERE id = ?", [id]);
                db.run("UPDATE products SET stock = ? WHERE id = ?", [newStock, product.id], function (err) {
                    if (err) return sendError(res, 500, err.message);
                    res.json({ success: true, message: "Transaction deleted", changes: this.changes });
                });
            });
        });
    });
});

app.put("/transactions/:id", (req, res) => {
    const id = req.params.id;
    const { notes } = req.body;

    db.get("SELECT * FROM transactions WHERE id = ?", [id], (err, tx) => {
        if (err) return sendError(res, 400, err.message);
        if (!tx) return sendError(res, 404, "Transaction not found");

        db.run("UPDATE transactions SET notes = ? WHERE id = ?", [notes, id], function (err) {
            if (err) return sendError(res, 400, err.message);
            res.json({ success: true, data: { ...tx, notes } });
        });
    });
});

app.get("/health", (req, res) => {
    res.json({ success: true, status: "ok" });
});

app.post("/login", (req, res) => {
    const { pin } = req.body;
    const CORRECT_PIN = "1234";

    if (pin === CORRECT_PIN) return res.json({ success: true, token: "fake-jwt-token" });
    return res.status(401).json({ success: false, error: "Invalid PIN" });
});

// Basic print endpoint: fallback if you run the backend on the same Windows machine
app.post('/print', (req, res) => {
    const payload = req.body;
    try {
        const printer = require('printer');
        const text = (() => {
            const lines = [];
            lines.push('********** Chek **********');
            lines.push(`Sana: ${new Date(payload.date).toLocaleString()}`);
            lines.push('');
            for (const it of payload.items || []) {
                lines.push(`${it.name}`);
                lines.push(`  ${it.quantity} x ${it.price.toLocaleString()} = ${it.total.toLocaleString()} so'm`);
            }
            lines.push('');
            lines.push(`Umumiy: ${payload.total?.toLocaleString() || 0} so'm`);
            lines.push('');
            lines.push('Rahmat!');
            lines.push('\n\n\n');
            return lines.join('\n');
        })();

        const printers = printer.getPrinters();
        const defaultPrinter = printers && printers.length ? printers[0].name : undefined;
        if (!defaultPrinter) return res.status(500).json({ success: false, error: 'No printers found' });

        printer.printDirect({
            data: Buffer.from(text, 'utf8'),
            printer: defaultPrinter,
            type: 'RAW',
            success: function (jobID) {
                res.json({ success: true, jobID });
            },
            error: function (err) {
                res.status(500).json({ success: false, error: String(err) });
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: String(err) });
    }
});

// ✅ MUHIM: LAN/telefon ko‘rishi uchun 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
