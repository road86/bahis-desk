// eslint-disable-next-line import/no-extraneous-dependencies
const electron = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const fs = require('fs');

// eslint-disable-next-line no-unused-vars
const { app, BrowserWindow, ipcMain, ipcRenderer, remote } = electron;
let mainWindow;

/** add the react and redux devtools to electron */
function addDevToolsExt() {
  BrowserWindow.addDevToolsExtension(
    path.join(
      os.homedir(),
      '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.2.0_0'
    )
  );
  BrowserWindow.addDevToolsExtension(
    path.join(
      os.homedir(),
      '/.config/google-chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0'
    )
  );
}

/** sets up new databse. Creates tables that are required */
function setUpNewDB() {
  const db = new Database('foobar.db');
  const setUpQueries = fs.readFileSync('set-up-queries.sql', 'utf8');
  db.exec(setUpQueries);
  db.close();
}
/** set up new db if not exists */
function prepareDb() {
  try {
    const db = new Database('foobar.db', { fileMustExist: true });
    db.close();
  } catch (err) {
    setUpNewDB();
    // eslint-disable-next-line no-console
    console.log('Database Setup!!!!');
  }
}

/** creats the db and sets up the window in electron */
function createWindow() {
  addDevToolsExt();
  prepareDb();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(
    isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`
  );
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('fetch-app-definition', event => {
  try {
    const db = new Database('foobar.db', { fileMustExist: true });
    // eslint-disable-next-line no-param-reassign
    event.returnValue = db.prepare('SELECT definition from app limit 1').get().definition;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
});

ipcMain.on('synchronous-message', event => {
  const tableCreationSQL =
    'CREATE TABLE if not exists contacts( contact_id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL UNIQUE);';
  const insertTableSQL =
    "INSERT INTO contacts(contact_id, first_name, last_name, email, phone) VALUES(0, 'nafiz', 'ahmed', 'nafiz@2bc.com', '0192'); ";
  const db = new Database('foobar.db');
  db.exec(tableCreationSQL);
  try {
    db.exec(insertTableSQL);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Already Present');
  }
  // eslint-disable-next-line no-param-reassign
  event.returnValue = db
    .prepare('SELECT first_name from contacts where contact_id=0')
    .get().first_name;
  db.close();
});
