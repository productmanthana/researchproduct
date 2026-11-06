import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
const output=new URL("./.research-test.mjs",import.meta.url);
const uiOutput=new URL("./.usage-limits-test.mjs",import.meta.url);
try {
  await build({entryPoints:[new URL("./src/lib/research.test.ts",import.meta.url).pathname],outfile:output.pathname,bundle:true,platform:"node",format:"esm",
    loader:{".csl":"text"},packages:"external",
    plugins:[{name:"workspace",setup(b){b.onResolve({filter:/^[^./]/},args=>{
      // Preserve conditional ESM exports; resolving with require selects the CJS build.
      if(args.path==="@weaviate/node")return {path:args.path,external:true};
      const require=createRequire(args.importer||import.meta.url);
      return {path:require.resolve(args.path),external:!args.path.startsWith("@workspace/")&&args.path!=="fast-xml-parser"};
    });}}],
  });
  await build({entryPoints:[new URL("../evidora/src/lib/usage-limits.test.ts",import.meta.url).pathname],outfile:uiOutput.pathname,bundle:true,platform:"node",format:"esm",packages:"external"});
  const result=spawnSync(process.execPath,["--test",...process.argv.slice(2),output.pathname,uiOutput.pathname],{stdio:"inherit"});
  process.exitCode=result.status??1;
}finally{await Promise.all([rm(output,{force:true}),rm(uiOutput,{force:true})]);}
