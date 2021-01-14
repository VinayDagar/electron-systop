const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const log = require('electron-log');
const Store = require('./Store');

// Set env
process.env.NODE_ENV = 'development';

const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

let mainWindow;

const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      cpuOverload: 80,
      alertFrequency: 5
    }
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'APP NAME',
    width: isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/icon.png`,
    resizable: isDev,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      // worldSafeExecuteJavaScript: true,
      // contextIsolation: true
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile('./app/index.html');
}

app.on('ready', () => {
  createMainWindow();

  mainWindow.webContents.on("dom-ready", () => {
    setUserSettings();
  });

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
});

const menu = [
  ...(isMac ? [{ role: 'appMenu' }] : []),
  {
    role: 'fileMenu',
  },
  ...(isDev
    ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { type: 'separator' },
          { role: 'toggledevtools' },
        ],
      },
    ]
    : []),
];

ipcMain.on("settings:set", (e, values) => {
  store.set('settings', values);
  setUserSettings();
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.allowRendererProcessReuse = true;


function setUserSettings() {
  mainWindow.webContents.send("settings:get", store.get('settings'));
}