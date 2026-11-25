import { a as normalizeOptions, o as logger } from "./options-B6dinSa6.mjs";
import { a as startWatcher, i as generateSpec, n as getConfigProjects, r as loadConfigFile, t as findConfigFile } from "./config-CLbRt_oo.mjs";
import { consoleReporter, getWarningCount, isString, resetWarnings, setLogLevel, setProjectName, withReporter } from "@orval/core";
//#region src/generate.ts
async function generate(optionsExport, workspace = process.cwd(), options) {
	return withReporter({
		reporter: consoleReporter,
		ifUnset: true
	}, () => generateWithReporter(optionsExport, workspace, options));
}
async function generateWithReporter(optionsExport, workspace, options) {
	resetWarnings();
	if (!optionsExport || isString(optionsExport)) {
		const configFilePath = findConfigFile(optionsExport);
		const configFile = await loadConfigFile(configFilePath);
		setLogLevel(options?.logLevel ?? configFile.logLevel ?? "info");
		const configs = getConfigProjects(configFile);
		let hasErrors = false;
		for (const [projectName, config] of configs) {
			setProjectName(projectName);
			const normalizedOptions = await normalizeOptions(config, workspace, options);
			try {
				await generateSpec(workspace, normalizedOptions, projectName);
			} catch (error) {
				logger.error(error);
				if (options?.throwOnError) throw error;
				hasErrors = true;
			}
			if (options?.watch !== void 0) {
				const fileToWatch = isString(normalizedOptions.input.target) ? normalizedOptions.input.target : void 0;
				await startWatcher(options.watch, async () => {
					resetWarnings();
					try {
						await generateSpec(workspace, normalizedOptions, projectName);
					} catch (error) {
						logger.error(error);
					}
					if (options.failOnWarnings && getWarningCount() > 0) throw new Error(`Process failed with ${getWarningCount()} warning(s) due to failOnWarnings option`);
				}, fileToWatch);
			}
		}
		setProjectName();
		if (hasErrors) logger.error("One or more project failed, see above for details");
		if (options?.failOnWarnings && getWarningCount() > 0) throw new Error(`Process failed with ${getWarningCount()} warning(s) due to failOnWarnings option`);
		return;
	}
	setLogLevel(options?.logLevel ?? "info");
	const normalizedOptions = await normalizeOptions(optionsExport, workspace, options);
	try {
		await generateSpec(workspace, normalizedOptions);
	} catch (error) {
		logger.error(error);
		if (options?.throwOnError) throw error;
	}
	if (options?.watch) await startWatcher(options.watch, async () => {
		resetWarnings();
		try {
			await generateSpec(workspace, normalizedOptions);
		} catch (error) {
			logger.error(error);
		}
		if (options.failOnWarnings && getWarningCount() > 0) throw new Error(`Process failed with ${getWarningCount()} warning(s) due to failOnWarnings option`);
	}, normalizedOptions.input.target);
	if (options?.failOnWarnings && getWarningCount() > 0) throw new Error(`Process failed with ${getWarningCount()} warning(s) due to failOnWarnings option`);
}
//#endregion
export { generate };

//# sourceMappingURL=generate-bG8Fnx6i.mjs.map