# Optom App - Backend

This is a minimal Express + SQLite backend for the Optom App project.

## Quick start

Install dependencies and start server:

```bash
cd backend
npm install
npm run start # or npm run dev
```

The server listens on `http://localhost:3000` by default.

## Useful endpoints

- `GET /health` - simple health check
- `GET /products` - list products
- `GET /products/:id` - get a product by id
- `POST /products` - add a product {name, price}
- `DELETE /products/:id` - delete a product
- `GET /transactions` - list transactions
- `POST /transactions/acceptance` - add incoming stock {productId, quantity, price, notes}
- `POST /transactions/sale` - sell stock {productId, quantity, price, notes}
- `POST /login` - login with pin {pin} (default PIN: `1234`)
- `POST /reset` - development-only: clear DB and reseed sample products

Note: login uses a simple PIN for demo purposes: `1234`. You can change this in `server.js` (search for `CORRECT_PIN`).

## Quick API smoke tests

Make sure the server is running and then:

```bash
cd backend
npm run test-api
```

This will call a subset of endpoints to verify basic behavior.
