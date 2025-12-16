// context/AppContext.tsx
import api, { Product, Transaction } from "@/services/api";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type { Product, Transaction };

type StoreContextType = {
  products: Product[];
  transactions: Transaction[];
  addProduct: (name: string, acceptancePrice: number, salePrice: number) => Promise<void>;
  addStock: (productId: string, quantity: number, price: number, notes?: string) => Promise<void>;
  sellStock: (productId: string, quantity: number, price: number, notes?: string) => Promise<boolean>;
  updateProduct: (
    productId: string,
    data: { name?: string; acceptancePrice?: number; salePrice?: number; stock?: number }
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  updateTransactionNotes: (transactionId: string, notes?: string) => Promise<void>;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const productsData = await api.getProducts();
      if (productsData.data) {
        setProducts((prev) => {
          const prevMap = new Map(prev.map((p) => [p.id, p]));
          return productsData.data.map((raw: any) => {
            const prevProduct = prevMap.get(raw.id);
            const basePrice = typeof raw.price === "number" ? raw.price : 0;

            const acceptancePrice =
              prevProduct?.acceptancePrice ??
              raw.acceptancePrice ??
              basePrice;

            const salePrice =
              prevProduct?.salePrice ??
              raw.salePrice ??
              basePrice;

            const merged: Product = {
              id: raw.id,
              name: raw.name,
              stock: raw.stock ?? 0,
              price: basePrice,
              acceptancePrice,
              salePrice,
            };

            return merged;
          });
        });
      }

      const transactionsData = await api.getTransactions();
      if (transactionsData.data) {
        setTransactions(transactionsData.data);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addProduct = async (name: string, acceptancePrice: number, salePrice: number) => {
    try {
      await api.addProduct(name, acceptancePrice, salePrice);
      await refreshData();
    } catch (e) {
      console.error("Failed to add product", e);
      throw e;
    }
  };

  const addStock = async (productId: string, quantity: number, price: number, notes?: string) => {
    try {
      await api.addStock(productId, quantity, price, notes);
      await refreshData();
    } catch (e) {
      console.error("Failed to add stock", e);
      throw e;
    }
  };

  const sellStock = async (productId: string, quantity: number, price: number, notes?: string): Promise<boolean> => {
    try {
      await api.sellStock(productId, quantity, price, notes);
      await refreshData();
      return true;
    } catch (e) {
      console.error("Failed to sell stock", e);
      return false;
    }
  };

  const updateProduct = async (
    productId: string,
    data: { name?: string; acceptancePrice?: number; salePrice?: number; stock?: number }
  ) => {
    try {
      await api.updateProduct(productId, data);
      // front tarafini ham darrov yangilab qo'yamiz
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
              ...p,
              ...data,
            }
            : p
        )
      );
      await refreshData();
    } catch (e) {
      console.error("Failed to update product", e);
      throw e;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      await refreshData();
    } catch (e) {
      console.error("Failed to delete product", e);
      throw e;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await api.deleteTransaction(transactionId);
      await refreshData();
    } catch (e) {
      console.error("Failed to delete transaction", e);
      throw e;
    }
  };

  const updateTransactionNotes = async (transactionId: string, notes?: string) => {
    try {
      await api.updateTransactionNotes(transactionId, notes);
      await refreshData();
    } catch (e) {
      console.error("Failed to update transaction", e);
      throw e;
    }
  };

  const login = async (pin: string) => {
    try {
      const result = await api.login(pin);
      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login failed", e);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        transactions,
        addProduct,
        addStock,
        sellStock,
        updateProduct,
        deleteProduct,
        deleteTransaction,
        updateTransactionNotes,
        isAuthenticated,
        login,
        logout,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
