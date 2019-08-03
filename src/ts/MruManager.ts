import { Platform } from './Consts';
import { Directory } from '../../lib/LibFs/Fs';
import { save, load } from './LocalStorage';
import { app, JumpListCategory, JumpListItem } from 'electron';


export class MruManager {

	public addMruItem(openedFolder: Directory): void {

		const loadedMru = MruPersistance.loadMru();

		// TODO lowercasing, depends on the FileSystem (Linux in particular)
		const remainder = loadedMru.filter(m => m.fullPath.toLowerCase() !== openedFolder.fullPath.toLowerCase());
		const theNewMruList = [ openedFolder, ...remainder ];

		if (theNewMruList.length > 8) {
			theNewMruList.length = 8;
		}

		MruPersistance.saveMru(theNewMruList);

		this.updateJumplist(theNewMruList);
	}

	public getMru(): Directory[] {
		const mru = MruPersistance.loadMru();

		this.updateJumplist(mru);

		return mru;
	}

	private updateJumplist(mruList: Directory[]): void {
		if (!Platform.IsWindows) return;

		const jumplist = JumplistBuilder.build(mruList);
		app.setJumpList(jumplist);
	}
}

namespace JumplistBuilder {

	export function build(mruList: Directory[]): JumpListCategory[] {

		let tasks = mruList.map(m => {
			return <JumpListItem>{
					type: "task",
					title: m.name,
					description: m.fullPath,
					program: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
					args: m.fullPath,
					iconPath: "explorer.exe",
					iconIndex: 0
				};
		});

		const removedItems = app.getJumpListSettings().removedItems.map(r => r.args);
		tasks = tasks.filter(t => !removedItems.find(r => t.args === r));

		return [
			{
		 		type: "custom",
		 		name: "Recent folders",
				items: tasks,
			}
		];
	}
}

namespace MruPersistance {

	export function loadMru(): Directory[] {
		return load("mru") || [];
	}

	export function saveMru(mru: Directory[]): void {
		save(mru, "mru");
	}

}