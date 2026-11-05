import { writeFileSync } from "node:fs";
// Path-parameter validators and query-parameter interfaces can share names.
// The server consumes validators; frontend model types live in api-client-react.
writeFileSync(new URL("../api-zod/src/index.ts", import.meta.url), 'export * from "./generated/api";\n');
