// services/printer.ts
// Minimal cross-platform print API. For desktop (Electron/Windows) the app
// should expose an IPC method `print-receipt` in the main process that
// accepts a JSON payload and performs the actual USB printing (ESC/POS
// or via the OS print spooler). On other platforms this will try the
// backend `/print` endpoint as a fallback, otherwise return false.

export type ReceiptItem = {
  name: string;
  quantity: number;
  price: number; // per unit
  total: number;
};

export async function printReceipt(items: ReceiptItem[], total: number) {
  const payload = { items, total, date: new Date().toISOString() };

  // Try Electron IPC (common integration when packaging as .exe)
  try {
    // Many Electron starters expose `window.electron.ipcRenderer`
    if (typeof window !== "undefined" && (window as any).electron && (window as any).electron.ipcRenderer) {
      const ipc = (window as any).electron.ipcRenderer;
      // prefer invoke (async + returns result) when available
      if (ipc.invoke) {
        const res = await ipc.invoke("print-receipt", payload);
        return Boolean(res && res.success);
      }
      // fallback to send (fire & forget)
      if (ipc.send) {
        ipc.send("print-receipt", payload);
        return true;
      }
    }
  } catch (e) {
    // ignore and try other methods
  }

  // Try backend print endpoint as fallback
  try {
    const res = await fetch("/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
