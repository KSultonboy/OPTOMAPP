// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let printer;
try {
  printer = require('printer');
} catch (e) {
  console.warn('printer native module not available. Printing will fail if invoked from main process.');
}

function formatReceipt(payload) {
  const lines = [];
  lines.push('********** Chek **********');
  lines.push(`Sana: ${new Date(payload.date).toLocaleString()}`);
  lines.push('');
  for (const it of payload.items) {
    lines.push(`${it.name}`);
    lines.push(`  ${it.quantity} x ${it.price.toLocaleString()} = ${it.total.toLocaleString()} so'm`);
  }
  lines.push('');
  lines.push(`Umumiy: ${payload.total.toLocaleString()} so'm`);
  lines.push('');
  lines.push('Rahmat!');
  lines.push('\n\n\n'); // feed
  return lines.join('\n');
}

async function doPrint(payload) {
  if (!printer) throw new Error('printer native module not available');

  const text = formatReceipt(payload);

  const printers = printer.getPrinters();
  const defaultPrinter = printers && printers.length ? printers[0].name : undefined;
  if (!defaultPrinter) throw new Error('No printers found on system');

  return new Promise((resolve, reject) => {
    printer.printDirect({
      data: Buffer.from(text, 'utf8'),
      printer: defaultPrinter,
      type: 'RAW',
      success: function (jobID) {
        resolve({ ok: true, jobID });
      },
      error: function (err) {
        reject(err);
      },
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev: try to open local expo web server
  const devUrl = 'http://localhost:19006';

  if (!app.isPackaged) {
    // Development: load the Expo web dev server
    win.loadURL(devUrl).catch(() => {
      // Fallback to local web build if dev server isn't available
      const indexPath = path.join(__dirname, '..', 'web-build', 'index.html');
      win.loadFile(indexPath).catch((err) => {
        console.error('Failed to load app in window:', err);
      });
    });
  } else {
    // Packaged app: load the built web files from the bundled resources
    const indexPath = path.join(process.resourcesPath, 'web-build', 'index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('Failed to load packaged app:', err);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('print-receipt', async (event, payload) => {
    try {
      const res = await doPrint(payload);
      return { success: true, jobID: res.jobID };
    } catch (err) {
      console.error('Print failed:', err?.message || err);
      return { success: false, error: String(err) };
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
