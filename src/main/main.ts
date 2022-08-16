/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, ipcRenderer } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import axios from 'axios';
import https from 'https';
import { spawn } from 'child_process';
// import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const store = new Store();
// store.set('WEB_URL', "http://localhost:3000")
// store.set('SERVER_URL', "http://localhost:8080")

store.set('WEB_URL', "https://i7a104.p.ssafy.io")
store.set('SERVER_URL', "https://i7a104.p.ssafy.io")


ipcMain.on('openAuthWindow', async(event) => {
  createAuthWindow();
  event.returnValue=""; // 이거 무조건 있어야 함!!!!!!!!!!!!!!!!!!!!!!!!!
})

// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});

ipcMain.on('login', async (event, id, password) => {
  console.log(id, password);
  try {
    const result = await axios({
      method: 'post',
      url: `${store.get('SERVER_URL')}/api/v1/auth`,
      data: {
        id,
        password,
      },
    });
    console.log(result.data);
    event.returnValue = result.data;
  } catch (err) {
    console.log(err);
    event.returnValue = { message: 'fail' };
  }
});

ipcMain.on('getLcuProcess', async (event) => {
  const bat = spawn(`wmic`, [
    'PROCESS',
    'WHERE',
    `name='LeagueClientUx.exe'`,
    'GET',
    'commandline',
  ]);

  bat.stdout.on('data', (data) => {
    // Handle data...
    console.log("stdout")
    console.log(String(data));
    event.returnValue = String(data);
  });

  bat.stderr.on('data', (err) => {
    console.log("stderr")
    console.log(String(err));
    event.returnValue = 'fail';
    // Handle error...
  });

  bat.on('close', (data) => {
    console.log("exit");
    console.log(String(data));
    // Handle exit
    // event.returnValue = 'ccccccccc';
  });
});

ipcMain.on('getSummonrName', async (event, lcuPort, pw) => {
  console.log(lcuPort, pw);
  try {
    const result = await axios({
      method: 'get',
      url: `https://127.0.0.1:${lcuPort}/lol-summoner/v1/current-summoner`,
      headers: {
        Authorization: `Basic ` + Buffer.from(`riot:${pw}`).toString('base64'),
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    console.log(result.data);
    event.returnValue = result.data;
  } catch (err) {
    console.log(err);
    event.returnValue = 'fail';
  }
});

ipcMain.on('tierAuth', async (event, name) => {
  try {
    const token = store.get('accessToken');
    const result = await axios({
      method: 'post',
      url: `${store.get('SERVER_URL')}/api/v1/lol`,
      data: {
        summonerName: name,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(result);
    event.returnValue = result.data;
  } catch (err) {
    console.log(err);
    event.returnValue = err;
  }
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createAuthWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };


  let authWindow: BrowserWindow | null = null;
  authWindow = new BrowserWindow({
    parent: mainWindow,
    model: false,
    width: 650, 
    height: 950, 
    autoHideMenuBar: true,
    icon: getAssetPath('icon.ico'),
    show: false,
    webPreferences: {
      preload: app.isPackaged
      ? path.join(__dirname, 'preload.js')
      : path.join(__dirname, '../../.erb/dll/preload.js'),
      // nodeIntegration: true,
    } 
    // 'web-security': false
  });
  let authUrl = `${store.get('WEB_URL')}/electron/social/auth`;

  authWindow.loadURL(authUrl);
  
  authWindow.on('ready-to-show', () => {
    if (!authWindow) {
      console.log("authwindow error")
      throw new Error('"authWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      authWindow.minimize();
    } else {
      authWindow.show();
    }
  });


  authWindow.webContents.on('will-redirect', function (event, newUrl) {

    console.log("----------------redirect----------------")
    if(newUrl.indexOf(`${store.get('WEB_URL')}/oauth/redirect`) != -1) {
      console.log(newUrl);
      const convertUrl = new URL(newUrl);
      store.set("accessToken", convertUrl.searchParams.get("token"));
      // 여기서 mainWindow로 이벤트 보내야 함. 근데리액튼데
      if(mainWindow !== null) {
        mainWindow.webContents.send('authLogin', 'success')
      }
      authWindow?.destroy()
    }
    // console.log(event)
    // console.log("--------------------------------")
    // More complex code to handle tokens goes here
  })
  
  authWindow.on('closed', function() {
    // console.log("----------close-------------")
    authWindow = null;
  });
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      // nodeIntegration: true,
      // contextIsolation: false,
      // enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      console.log("mainwindow error")
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    console.log('-----------main close---------')
    mainWindow = null;
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
