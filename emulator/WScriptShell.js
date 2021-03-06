const lib = require("../lib.js");
const argv = require("../argv.js");

function WScriptShell() {
	const vars = {
		/* %APPDATA% equals C:\Documents and Settings\{username}\Application Data on Windows XP,
		 * but C:\Users\{username}\AppData\Roaming on Win Vista and above.
		 */
		appdata: argv["windows-xp"]
			? "C:\\Documents and Settings\\User\\Application Data"
			: "C:\\Users\\User\\AppData\\Roaming",
		computername: "USER-PC",
		processor_revision: "0209",
		processor_architecture: "x86",
		programdata: "C:\\ProgramData",
		tmp: "C:\\DOCUME~1\\User\\LOCALS~1\\Temp",
		temp: "C:\\DOCUME~1\\User\\LOCALS~1\\Temp",
		username: "User",
		userprofile: "C:\\Users\\User",
		windir: "C:\\WINDOWS"
	};
	this.environment = (x) => {
		if (x.toLowerCase() === "system")
			return (argument) => {
				argument = argument.toLowerCase();
				if (argument in vars) return vars[argument];
				lib.kill(`Unknown parameter ${argument} for WScriptShell.Environment.System`);
			};
		return `(Environment variable ${x})`;
	};
	this.specialfolders = (x) => `(Special folder ${x})`;
	this.createshortcut = () => ({});
	this.expandenvironmentstrings = (path) => {
		Object.keys(vars).forEach(key => {
			path = path.replace(RegExp("%" + key + "%", "gi"), vars[key]);
		});

		if (/%\w+%/i.test(path)) {
			lib.warning("Possibly failed to expand environment strings in " + path);
		}
		return path;
	};
	this.exec = this.run = function(...args) {
		const command = args.join(" ");
		const filename = lib.getUUID();
		lib.info(`Executing ${lib.directory + filename} in the WScript shell`);
		lib.logSnippet(filename, {as: "WScript code"}, command);
		if (!argv["no-shell-error"])
			throw new Error("If you can read this, re-run box.js with the --no-shell-error flag.");
	};
	this._reg_entries = {
		"HKLM\\SOFTWARE\\MICROSOFT\\WINDOWS NT\\CURRENTVERSION\\CURRENTVERSION": "5.1",
		"HKLM\\SOFTWARE\\MICROSOFT\\WINDOWS NT\\CURRENTVERSION\\SYSTEMROOT": "C:\\WINDOWS",
		"HKLM\\SOFTWARE\\MICROSOFT\\WINDOWS\\CURRENTVERSION\\EXPLORER\\SHELL FOLDERS\\COMMON DOCUMENTS": "C:\\Users\\Public\\Documents",
		"HKLM\\SOFTWARE\\MICROSOFT\\WINDOWS\\CURRENTVERSION\\INTERNET SETTINGS\\URL HISTORY\\DIRECTORY": "C:\\Windows\\History",
		"HKLM\\SOFTWARE\\MICROSOFT\\WINDOWS\\CURRENTVERSION\\EXPLORER\\VOLUMECACHES\\ACTIVE SETUP TEMP FOLDERS\\FOLDER": "C:\\Windows\\msdownld.tmp|?:\\msdownld.tmp"
	};
	this._normalize_reg_key = (key) => {
		key = key.toUpperCase().replace("HKEY_LOCAL_MACHINE", "HKLM");
		key = key.replace("HKEY_CLASSES_ROOT", "HKCR").replace("HKEY_USERS", "HKU");
		key = key.replace("HKEY_CURRENT_USER", "HKCU").replace("HKEY_CURRENT_CONFIG", "HKCC");
		return key;
	};
	this.regread = (key) => {
		key = this._normalize_reg_key(key);
		lib.verbose(`Reading registry key ${key}`);
		if (key in this._reg_entries)
			return this._reg_entries[key];
		lib.warning(`Unknown registry key ${key}!`);
		return "";
	};
	this.regwrite = (key, value, type = "(unspecified)") => {
		key = this._normalize_reg_key(key);
		lib.info(`Setting registry key ${key} to ${value} of type ${type}`);
		this._reg_entries[key] = value;
	};
	this.popup = function(text, a, title = "[Untitled]", b) {
		if (!argv["no-echo"]) {
			lib.verbose(`Script opened a popup window: title "${title}", text "${text}"`);
			lib.verbose("Add flag --no-echo to disable this.");
		}
		return true; // Emulates a click
	};
}

module.exports = lib.proxify(WScriptShell, "WScriptShell");