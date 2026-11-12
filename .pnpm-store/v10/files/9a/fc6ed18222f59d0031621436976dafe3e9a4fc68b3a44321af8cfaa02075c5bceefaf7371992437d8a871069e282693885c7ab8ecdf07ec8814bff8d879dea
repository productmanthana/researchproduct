import { GetterPropType, HTTP_STATUS_CODE_SHARED_TYPES, camel, generateAxiosUrl, generateFormDataAndUrlEncodedFunction, generateMutatorConfig, generateMutatorRequestOptions, generateOptions, generateVerbImports, getResponseStatusCondition, getStatusCodeType, isSyntheticDefaultImportsAllow, needsHttpStatusCodeTypes, pascal, sanitize, toObjectString } from "@orval/core";
//#region src/index.ts
const AXIOS_DEPENDENCIES = [{
	exports: [
		{
			name: "axios",
			default: true,
			values: true,
			syntheticDefaultImport: true
		},
		{ name: "AxiosRequestConfig" },
		{ name: "AxiosResponse" }
	],
	dependency: "axios"
}];
const PARAMS_SERIALIZER_DEPENDENCIES = [{
	exports: [{
		name: "qs",
		default: true,
		values: true,
		syntheticDefaultImport: true
	}],
	dependency: "qs"
}];
const hasHttpResponseReturnType = (override) => !!override && [
	override,
	...Object.values(override.operations),
	...Object.values(override.tags)
].some((entry) => entry?.axios?.includeHttpResponseReturnType);
const getAxiosDependencies = (hasGlobalMutator, hasParamsSerializerOptions, _packageJson, _httpClient, _hasTagsMutator, override) => [...hasGlobalMutator ? hasHttpResponseReturnType(override) ? [{
	exports: [{ name: "AxiosResponse" }],
	dependency: "axios"
}] : [] : AXIOS_DEPENDENCIES, ...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : []];
const getAxiosFactoryDependencies = (hasGlobalMutator, hasParamsSerializerOptions, _packageJson, _httpClient, hasTagsMutator, override) => [{
	exports: [
		{
			name: "axios",
			default: true,
			values: true,
			syntheticDefaultImport: true
		},
		...!hasGlobalMutator && !hasTagsMutator ? [{ name: "AxiosInstance" }] : [],
		...hasGlobalMutator ? hasHttpResponseReturnType(override) ? [{ name: "AxiosResponse" }] : [] : [{ name: "AxiosRequestConfig" }, { name: "AxiosResponse" }]
	],
	dependency: "axios"
}, ...hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : []];
const getAxiosResponseTypes = (response, typeName) => {
	const responseTypeName = `${typeName}Response`;
	const responses = response.types.success.length ? response.types.success : [{
		key: "default",
		contentType: "",
		value: response.definition.success || "unknown"
	}];
	const responseKeys = responses.map(({ key }) => key);
	const nonDefaultStatuses = responses.filter(({ key }) => key !== "default").map(({ key }) => getStatusCodeType(key, responseKeys));
	const uniqueNonDefaultStatuses = [...new Set(nonDefaultStatuses)];
	const types = responses.map((entry) => {
		const hasDuplicateStatus = responses.filter(({ key }) => key === entry.key).length > 1;
		const name = `${responseTypeName}${pascal(entry.key)}${hasDuplicateStatus ? pascal(entry.contentType) : ""}`;
		const status = entry.key === "default" ? uniqueNonDefaultStatuses.length ? `Exclude<HTTPStatusCodes, ${uniqueNonDefaultStatuses.join(" | ")}>` : "number" : getStatusCodeType(entry.key, responseKeys);
		return {
			name,
			value: `export type ${name} = AxiosResponse<${entry.value || "unknown"}> & {
  status: ${status}
}`
		};
	});
	return {
		name: responseTypeName,
		value: `${types.map(({ value }) => value).join("\n\n")}

export type ${responseTypeName} = ${types.map(({ name }) => name).join(" | ")}`
	};
};
const getEmptyResponseStatusCondition = (response) => {
	const statuses = [...new Set(response.types.success.map(({ key }) => key))];
	return statuses.filter((key) => response.types.success.filter((entry) => entry.key === key).every(({ value }) => value === "void")).map((key) => {
		const condition = getResponseStatusCondition({
			key,
			declaredKeys: statuses,
			accessor: "response.status"
		});
		return key === "default" ? condition : `(${condition})`;
	}).join(" || ");
};
const normalizeEmptyAxiosResponse = (condition) => condition ? `.then((response) =>
      ${condition}
        ? { ...response, data: undefined }
        : response,
    )` : "";
const generateAxiosImplementation = ({ headers, queryParams, operationName, urlHelperName, typeName, response, mutator, body, props, verb, override, formData, formUrlEncoded, paramsSerializer }, { route, context }, isFactoryMode = false) => {
	const isRequestOptions = override.requestOptions !== false;
	const includeHttpResponseReturnType = override.axios?.includeHttpResponseReturnType;
	const axiosResponse = getAxiosResponseTypes(response, typeName);
	const emptyResponseNormalization = normalizeEmptyAxiosResponse(getEmptyResponseStatusCondition(response));
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const isExactOptionalPropertyTypes = !!context.output.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
	const isSyntheticDefaultImportsAllowed = isSyntheticDefaultImportsAllow(context.output.tsconfig);
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	if (mutator) {
		const mutatorConfig = generateMutatorConfig({
			route,
			body,
			headers,
			queryParams,
			response,
			verb,
			isFormData,
			isFormUrlEncoded,
			hasSignal: false,
			isExactOptionalPropertyTypes
		});
		const requestOptions = isRequestOptions ? generateMutatorRequestOptions(override.requestOptions, mutator.hasSecondArg) : "";
		const returnType = (title) => includeHttpResponseReturnType ? `${axiosResponse.value}

export type ${pascal(typeName)}Result = ${axiosResponse.name}` : `export type ${pascal(typeName)}Result = NonNullable<Awaited<ReturnType<${title ? `ReturnType<typeof ${title}>['${operationName}']` : `typeof ${operationName}`}>>>`;
		return {
			implementation: `const ${operationName} = (\n    ${toObjectString(props.map((prop) => mutator.bodyTypeName && body.definition && prop.type === GetterPropType.BODY && prop.implementation.endsWith(`: ${body.definition}`) ? {
				...prop,
				implementation: `${prop.implementation.slice(0, -body.definition.length)}${mutator.bodyTypeName}<${body.definition}>`
			} : prop), "implementation")}\n ${isRequestOptions && mutator.hasSecondArg ? `options${context.output.optionsParamRequired ? "" : "?"}: SecondParameter<typeof ${mutator.name}<${response.definition.success || "unknown"}>>,` : ""}) => {${bodyForm}
      return ${mutator.name}<${response.definition.success || "unknown"}>(
      ${mutatorConfig},
      ${requestOptions})${includeHttpResponseReturnType ? ` as Promise<${axiosResponse.name}>` : ""};
    }
  `,
			returnType
		};
	}
	const options = generateOptions({
		route,
		body,
		headers,
		queryParams,
		response,
		verb,
		requestOptions: override.requestOptions,
		isFormData,
		isFormUrlEncoded,
		paramsSerializer,
		paramsSerializerOptions: override.paramsSerializerOptions,
		isExactOptionalPropertyTypes,
		hasSignal: false
	});
	const returnType = () => includeHttpResponseReturnType ? `${axiosResponse.value}

export type ${pascal(typeName)}Result = ${axiosResponse.name}` : `export type ${pascal(typeName)}Result = AxiosResponse<${response.definition.success || "unknown"}>`;
	const axiosRef = isFactoryMode ? "axiosInstance" : `axios${isSyntheticDefaultImportsAllowed ? "" : ".default"}`;
	const urlProps = props.filter((prop) => prop.type === GetterPropType.PARAM || prop.type === GetterPropType.NAMED_PATH_PARAMS || prop.type === GetterPropType.QUERY_PARAM);
	const urlImplementation = generateAxiosUrl({
		functionName: urlHelperName ?? camel(`get-${operationName}-url`),
		propsImplementation: toObjectString(urlProps, "implementation"),
		route,
		axiosRef,
		hasQueryParams: !!queryParams,
		paramsSerializer: paramsSerializer?.name,
		paramsSerializerOptions: override.paramsSerializerOptions
	});
	return {
		implementation: `const ${operationName} = (\n    ${toObjectString(props, "implementation")} ${isRequestOptions ? `options${context.output.optionsParamRequired ? "" : "?"}: AxiosRequestConfig\n` : ""} ): Promise<${includeHttpResponseReturnType ? axiosResponse.name : `AxiosResponse<${response.definition.success || "unknown"}>`}> => {${bodyForm}
    return ${axiosRef}.${verb}(${options})${includeHttpResponseReturnType ? emptyResponseNormalization + ` as Promise<${axiosResponse.name}>` : ""};
  }
${isFactoryMode ? urlImplementation.replace(/^export /, "") : urlImplementation}`,
		returnType
	};
};
const generateAxiosTitle = (title) => {
	const sanTitle = sanitize(title);
	return `get${pascal(sanTitle)}`;
};
const generateAxiosHeader = ({ title, isRequestOptions, isMutator, isGlobalMutator, noFunction, output, verbOptions }) => {
	const axiosDefault = isSyntheticDefaultImportsAllow(output.tsconfig) ? "axios" : "axios.default";
	const hasAnyMutator = isGlobalMutator || Object.values(verbOptions).some((verbOption) => !!verbOption.mutator);
	const implementation = `
${isRequestOptions && isMutator ? `type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];\n\n` : ""}
  ${noFunction ? "" : hasAnyMutator ? `export const ${title} = () => {\n` : `export const ${title} = (axiosInstance: AxiosInstance = ${axiosDefault}) => {\n`}`;
	return Object.values(verbOptions).some((verbOption) => verbOption.override?.axios?.includeHttpResponseReturnType && needsHttpStatusCodeTypes(getAxiosResponseTypes(verbOption.response, verbOption.typeName).value)) ? {
		implementation,
		sharedTypes: HTTP_STATUS_CODE_SHARED_TYPES
	} : implementation;
};
const generateAxiosFooter = ({ operationNames, operations, title, noFunction, hasMutator, hasAwaitedType }) => {
	let footer = "";
	if (!noFunction) {
		const urlOperationNames = (operations ?? []).filter((operation) => !operation.mutator).map((operation) => operation.urlHelperName ?? camel(`get-${operation.operationName}-url`));
		footer += `return {${[...operationNames, ...urlOperationNames].join(",")}}};\n`;
	}
	if (hasMutator && !hasAwaitedType) footer += `\ntype AwaitedInput<T> = PromiseLike<T> | T;\n
    type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
\n`;
	if (operations) {
		for (const operation of operations) if (operation.types?.result) footer += operation.types.result(noFunction ? void 0 : title) + "\n";
	}
	return footer;
};
const generateAxios = (verbOptions, options, isFactoryMode = false) => {
	const imports = generateVerbImports(verbOptions);
	const { implementation, returnType } = generateAxiosImplementation(verbOptions, options, isFactoryMode);
	return {
		implementation,
		imports,
		returnType
	};
};
const generateAxiosFactory = (verbOptions, options) => {
	const { implementation, imports, returnType } = generateAxios(verbOptions, options, true);
	return {
		implementation,
		imports,
		returnType
	};
};
const generateAxiosFunctions = (verbOptions, options) => {
	const { implementation, imports, returnType } = generateAxios(verbOptions, options);
	return {
		implementation: "export " + implementation,
		imports,
		returnType
	};
};
const axiosClientBuilder = {
	client: generateAxiosFactory,
	header: generateAxiosHeader,
	dependencies: getAxiosFactoryDependencies,
	footer: generateAxiosFooter,
	title: generateAxiosTitle
};
const axiosFunctionsClientBuilder = {
	client: generateAxiosFunctions,
	header: (options) => generateAxiosHeader({
		...options,
		noFunction: true
	}),
	dependencies: getAxiosDependencies,
	footer: (options) => generateAxiosFooter({
		...options,
		noFunction: true
	}),
	title: generateAxiosTitle
};
const builder = ({ type = "axios-functions" } = {}) => () => {
	if (type === "axios-functions") return axiosFunctionsClientBuilder;
	return axiosClientBuilder;
};
//#endregion
export { builder, builder as default, generateAxios, generateAxiosFactory, generateAxiosFooter, generateAxiosFunctions, generateAxiosHeader, generateAxiosTitle, getAxiosDependencies, getAxiosFactoryDependencies };

//# sourceMappingURL=index.mjs.map