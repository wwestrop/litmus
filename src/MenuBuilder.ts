import { Menu, MenuItem, dialog, shell } from "electron";
import { TestStatus } from "./ts/types/TestStatus";
import { DEV_MODE } from './ts/Consts';
import { Directory } from '../lib/LibFs/Fs';
import { MruManager } from './ts/MruManager';
import { ApplicationStatus } from './ui/script/applicationStatus';
import { LitmusMainWindow } from "./LitmusMainWindow";


export class MenuBuilder {

	private applicationStatus: ApplicationStatus = "welcome";
	private selectedFilter: TestStatus | null = null;

	public constructor(private readonly mru: MruManager) { }

	private menus: any;

	private createMenuTemplate() {
		this.menus = {
			fileOpenFolder: new MenuItem({
				label: "Open folder…",
				accelerator: "CmdOrCtrl+O",
				enabled: this.applicationStatus === "welcome" || this.applicationStatus === "idle",
				click: () => {
					LitmusMainWindow.openDirectory();
				}
			}),
			//////////////////////////////////////////////////////////////
			viewAll: new MenuItem({
				label: "View &all tests",
				accelerator: "CmdOrCtrl+1",
				type: "radio",
				checked: this.selectedFilter === null,
				click: () => LitmusMainWindow.onFilterMenuChanged(null),
			}),
			viewPassed: new MenuItem({
				label: "View &passed tests",
				accelerator: "CmdOrCtrl+2",
				type: "radio",
				checked: this.selectedFilter === "Passed",
				click: () => LitmusMainWindow.onFilterMenuChanged("Passed"),
			}),
			viewFailed: new MenuItem({
				label: "View &failed tests",
				accelerator: "CmdOrCtrl+3",
				type: "radio",
				checked: this.selectedFilter === "Failed",
				click: () => LitmusMainWindow.onFilterMenuChanged("Failed"),
			}),
			viewSkipped: new MenuItem({
				label: "View &skipped tests",
				accelerator: "CmdOrCtrl+4",
				type: "radio",
				checked: this.selectedFilter === "Skipped",
				click: () => LitmusMainWindow.onFilterMenuChanged("Skipped"),
			}),
			//////////////////////////////////////////////////////////////
			testsRunAll: new MenuItem({
				label: "Run all tests",
				accelerator: "F5",
				enabled: this.applicationStatus === "idle",
				click: () => {
					LitmusMainWindow.runTests();
				}
			}),
			testsRunVisible: new MenuItem({
				label: "Run visible tests only",
				accelerator: "F6",
				enabled: this.applicationStatus === "idle",
				click: () => {
					dialog.showErrorBox("Not implemented", "Not implemented");
				}
			}),
			testsStop: new MenuItem({
				label: "Stop running tests",
				accelerator: "Esc",
				enabled: this.applicationStatus === "testing",
				click: () => {
					LitmusMainWindow.stopTests();
				}
			}),
		};
	}

	/** Also sets-up application keyboard shortcuts */
	public initMainMenu(): Menu {

		this.createMenuTemplate();

		const menuBar = new Menu();
		menuBar.append(new MenuItem({
			label: "&Litmus",
			submenu: [
				{
					label: "About Litmus",
					role: "about"
				},
				{
					type: "separator",
				},
				{
					role: "services",
				},
				{
					type: "separator",
				},
				{
					role: "hide",
				},
				{
					role: "hideothers",
				},
				{
					type: "separator",
				},
				{
					role: "quit"
				},
			]
		}));

		const fileMenuContents = new Menu();
		fileMenuContents.append(this.menus.fileOpenFolder);
		fileMenuContents.append(new MenuItem({
			type: "separator",
		}));

		const mruMenuItems = this.buildMruMenuItems();
		for (const m of mruMenuItems) {
			fileMenuContents.append(m);
		}

		menuBar.append(new MenuItem({
			label: "&File",
			submenu: fileMenuContents,
		}));

		menuBar.append(new MenuItem({
			label: "&Edit",
			role: "editMenu",
		}));

		const viewMenuContents = new Menu();
		viewMenuContents.append(this.menus.viewAll);
		viewMenuContents.append(this.menus.viewPassed);
		viewMenuContents.append(this.menus.viewFailed);
		viewMenuContents.append(this.menus.viewSkipped);
		viewMenuContents.append(new MenuItem({
			type: "separator",
		}));
		viewMenuContents.append(new MenuItem({
			label: "Test &results",
			type: "radio",
			checked: true,
		}));
		viewMenuContents.append(new MenuItem({
			label: "Test &coverage",
			type: "radio",
			enabled: false,
		}));
		viewMenuContents.append(new MenuItem({
			type: "separator",
		}));
		viewMenuContents.append(new MenuItem({
			label: "Zoom In",
			accelerator: "CmdOrCtrl+Shift+Plus",
			click: () => {
				LitmusMainWindow.zoomIn();
			},
		}));
		viewMenuContents.append(new MenuItem({
			label: "Zoom Out",
			accelerator: "CmdOrCtrl+Shift+-",
			click: () => {
				LitmusMainWindow.zoomOut();
			},
		}));
		viewMenuContents.append(new MenuItem({
			type: "separator",
		}));

		if (DEV_MODE) {
			viewMenuContents.append(new MenuItem({
				label: "Developer tools",
				accelerator: "F12",
				click: () => {
					LitmusMainWindow.toggleDevTools();
				}
			}));
		}

		viewMenuContents.append(new MenuItem({
			type: "separator",
		}));
		viewMenuContents.append(new MenuItem({
			label: "Full screen",
			accelerator: "F11",
			type: "checkbox",
			click: () => {
				LitmusMainWindow.toggleFullScreen();
			},
		}));
		menuBar.append(new MenuItem({
			label: "&View",
			submenu: viewMenuContents,
		}));

		const testMenuContents = new Menu();
		testMenuContents.append(this.menus.testsRunAll);
		testMenuContents.append(this.menus.testsRunVisible);
		testMenuContents.append(new MenuItem({
			type: "separator",
		}));
		testMenuContents.append(this.menus.testsStop);
		menuBar.append(new MenuItem({
			label: "&Test",
			submenu: testMenuContents,
		}));

		menuBar.append(new MenuItem({
			label: "&Window",
			role: "windowMenu"
		}));

		menuBar.append(new MenuItem({
			label: "&Help",
			submenu: [
				{
					label: "Online documentation",
					accelerator: "F1",
					click: () => shell.openExternal("https://litmus-js.app")
				}
			]
		}));

		return menuBar;
	}

	private buildMruMenuItems(): MenuItem[] {
		const result: MenuItem[] = [];

		const mruList = this.mru.getMru();
		if (mruList.length === 0) {
			result.push(new MenuItem({
				enabled: false,
				label: "(Recently opened projects)",
			}));
		}
		else {
			// // Clear existing MRU
			// app.applicationMenu.get
			const mruMenuItems = buildIndividualMenuItems(mruList);
			for (let i = 0; i < mruMenuItems.length; i++) {
				result.push(mruMenuItems[i]);
			}
		}

		return result;

		function buildIndividualMenuItems(mruList: Directory[]): MenuItem[] {
			const mruMenuItems: MenuItem[] = [];
			for (let i = 1; i <= mruList.length; i++) {
				const mru = mruList[i - 1];
				mruMenuItems.push(new MenuItem({
					id: `mru-${i}`,
					label: `&${i} ${mru.name}`,
					click: () => LitmusMainWindow.openSpecificDirectory(mru.fullPath),
				}));
			}
			return mruMenuItems;
		}
	}

	public setApplicationStatus(applicationStatus: ApplicationStatus) {
		this.applicationStatus = applicationStatus;

		this.menus.fileOpenFolder.enabled = this.applicationStatus === "welcome" || this.applicationStatus === "idle";
		this.menus.testsRunAll.enabled = this.applicationStatus === "idle";
		this.menus.testsRunVisible.enabled = this.applicationStatus === "idle";
		this.menus.testsStop.enabled = this.applicationStatus === "testing";
	}

	public setSelectedTestFilter(selectedFilter: TestStatus | null) {
		this.selectedFilter = selectedFilter;

		let menuItem: MenuItem;
		switch (selectedFilter) {
			case "Passed":
				menuItem = this.menus.viewPassed;
				break;
			case "Failed":
				menuItem = this.menus.viewFailed;
				break;
			case "Skipped":
				menuItem = this.menus.viewSkipped;
				break;
			default:
				menuItem = this.menus.viewAll;
				break;
		}

		if (menuItem.checked === false) {
			menuItem.checked = true;
		}
	}
}