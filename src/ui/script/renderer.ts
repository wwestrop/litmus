import { ipcRenderer } from 'electron';
import { TestRun } from '../../ts/types/TestRun';

// TODO factor constant
ipcRenderer.on("update-test-results", (e: any, f: TestRun) => {

	console.log(new Date().getTime());

	const el = document.getElementsByTagName("x-resultstree")[0];

	const lastTest = f.IndividualTestResults[f.IndividualTestResults.length - 1];
	const testPath = `${lastTest.TestCase.hierarchy.join(" > ")} > ${lastTest.TestCase.displayName}`;

	const btn = document.createElement("p");
	btn.style.color = lastTest.Result === "Failed" ? "#FE4E4E" : null;
	btn.title = lastTest.TestCase.fileName; // The tooltip
	const t = document.createTextNode(`>> ${f.Progress.toFixed(0)}%   @${(f.Duration / 1000).toFixed(1)}s         ::::   ${testPath}`);
	btn.appendChild(t);                                // Append the text to <button>
	el.appendChild(btn);
});

ipcRenderer.on("dev-reset", (e: Event) => {
	// TOOD dev aid only
	const el = document.getElementsByTagName("x-resultstree")[0];
	el.innerHTML = "";
});

ipcRenderer.on("focusSearchBox", (e: Event) => {
	const searchBox = document.getElementById("tests-searchbox") as HTMLInputElement;
	searchBox.focus();
	searchBox.selectionStart = 0;
	searchBox.selectionEnd = searchBox.value.length;
});