declare module "electron-localshortcut" {

	import { BrowserWindow } from "electron";


	function register(accelerator: string | string[], callback: () => void): undefined;
	function register(win: BrowserWindow, accelerator: string | string[], callback: () => void): undefined;


	function unregister(accelerator: string | string[]): undefined;
	function unregister(win: BrowserWindow, accelerator: string | string[]): undefined;


	function unregisterAll(): undefined;
	function unregisterAll(win: BrowserWindow): undefined;


	function isRegistered(accelerator: string): boolean;
	function isRegistered(win: BrowserWindow, accelerator: string): boolean;


	function enableAll(win: BrowserWindow): undefined;


	function disableAll(win: BrowserWindow): undefined;

}