export const DEV_MODE = process.env["LITMUS_DEV"] !== undefined && process.env["LITMUS_DEV"] !== "0";


export namespace Platform {
	export const IsWindows = (process.platform === 'win32');
	export const IsMacOS = (process.platform === 'darwin');
	export const IsLinux = (process.platform === 'linux');
}