import { ipcRenderer } from 'electron';
import { TestRun } from '../../ts/types/TestRun';

// TODO factor constant
ipcRenderer.on("update-test-results", (e: any, f: TestRun) => {

	console.log(new Date().getTime());

	const el = document.getElementsByTagName("x-resultstree")[0];

	const btn = document.createElement("p");
	const t = document.createTextNode(`>> ${f.Progress.toFixed(0)}%   @${(f.Duration / 1000).toFixed(1)}s %`);
	btn.appendChild(t);                                // Append the text to <button>
	el.appendChild(btn);
});

ipcRenderer.on("dev-reset", (e: any) => {
	const el = document.getElementsByTagName("x-resultstree")[0];
	el.innerHTML = "";
});