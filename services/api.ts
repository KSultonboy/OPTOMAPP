// services/api.ts

// Wi-Fi IP manziling (ipconfig dan olgan eding)
const DEV_MACHINE_IP = "10.244.171.155";

// Agar xohlasang emulator uchun alohida qilsa bo'ladi
// hozircha ham Android, ham iOS bir xil IP ga uriladi
const BASE_URL = `http://${DEV_MACHINE_IP}:3000`;

export const API_URL = BASE_URL;

export type Product = {
  id: string;
  name: string;
  stock: number;

  // Backend hozircha faqat "price" ni biladi.
  // acceptancePrice va salePrice front tarafida ishlatamiz,
  // keyin backendga ham qo'shamiz.
  price?: number;
  acceptancePrice?: number;
  salePrice?: number;
};

export type Transaction = {
  id: string;
  type: "acceptance" | "sale";
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  notes?: string;
};

export const api = {
  async getProducts() {
    const response = await fetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async addProduct(name: string, acceptancePrice: number, salePrice: number) {
    const response = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        // Hozircha backend faqat price bilan ishlaydi,
        // uni SOTUV narxi deb qabul qilamiz
        price: salePrice,
        // Kelajak uchun:
        acceptancePrice,
        salePrice,
      }),
    });
    if (!response.ok) throw new Error("Failed to add product");
    return response.json();
  },

  async deleteProduct(id: string) {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },

  async updateProduct(
    id: string,
    data: { name?: string; acceptancePrice?: number; salePrice?: number; stock?: number }
  ) {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.salePrice !== undefined) {
      // Backendda price ustuni bor, hozircha uni SOTUV narxiga bog'laymiz
      payload.price = data.salePrice;
      payload.salePrice = data.salePrice;
    }
    if (data.acceptancePrice !== undefined) {
      payload.acceptancePrice = data.acceptancePrice;
    }
    if (data.stock !== undefined) payload.stock = data.stock;

    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async getTransactions() {
    const response = await fetch(`${BASE_URL}/transactions`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async deleteTransaction(id: string) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
    return response.json();
  },

  async updateTransactionNotes(id: string, notes?: string) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    return response.json();
  },

  async addStock(productId: string, quantity: number, price: number, notes?: string) {
    const response = await fetch(`${BASE_URL}/transactions/acceptance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, price, notes }),
    });
    if (!response.ok) throw new Error("Failed to add stock");
    return response.json();
  },

  async sellStock(productId: string, quantity: number, price: number, notes?: string) {
    const response = await fetch(`${BASE_URL}/transactions/sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, price, notes }),
    });
    if (!response.ok) throw new Error("Failed to sell stock");
    return response.json();
  },

  async login(pin: string) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!response.ok) return { success: false };
    return response.json();
  },
};

export default api;
