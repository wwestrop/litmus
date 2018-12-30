import { remote, BrowserWindow } from 'electron';


// why does JS not just have direct named access to query params built in FFS?????????????????
const querystringMather = /\?parentWindowId=([0-9]+)/;
const results = querystringMather.exec(remote.getCurrentWebContents().getURL());
const parentWindowId = Number.parseInt(results![1]);

/** Returns the "parent" of the current window.
 * (Parent hierarchy is defined in Litmus by initiating a window with a `parentWindowId` query string param) */
export const parentWindow: BrowserWindow = remote.BrowserWindow.fromId(parentWindowId);