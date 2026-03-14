const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let icon;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'),
      // Crucial: removes browser restriction that blocks audio without user click!
      autoplayPolicy: "no-user-gesture-required",
      // Relax security for Supabase sync from file://
      webSecurity: false,
      allowRunningInsecureContent: true,
      backgroundThrottling: false
    },
    title: "Alarm App",
    autoHideMenuBar: true
  });

  // Check if we are running in production (packaged) or development
  if (app.isPackaged) {
    // When built as a standalone .exe, load the bundled dist/index.html file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // Start with local dev server when testing via npm run desktop
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5175';
    mainWindow.loadURL(startUrl);
  }

  // Prevent app from exiting when window is closed (minimize to tray)
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Create an empty native image for tray (or load an icon)
  icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App', click: () => {
        mainWindow.show();
        mainWindow.focus();
      } 
    },
    { type: 'separator' },
    { label: 'Quit', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Background Alarm System');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// React will call this when an alarm triggers from the web side!
ipcMain.on('show-alarm-window', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    
    // Forces window to the very front, above all other things
    mainWindow.setAlwaysOnTop(true);
    // Instantly disable alwaysOnTop right after bringing it forward so it acts normal again
    mainWindow.setAlwaysOnTop(false);
  }
});
