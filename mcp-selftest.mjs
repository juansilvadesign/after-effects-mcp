import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";

const BRIDGE = process.env.TEST_BRIDGE_DIR;
const SERVER = path.resolve("build/index.js");

const transport = new StdioClientTransport({
  command: "node",
  args: [SERVER],
  env: { ...process.env, AE_MCP_BRIDGE_DIR: BRIDGE },
  stderr: "ignore"
});
const client = new Client({ name: "selftest", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map(t => t.name).sort();
console.log("TOOL_COUNT:" + names.length);
console.log("TOOLS:" + names.join(","));

const expectNew = ["bridge-status", "save-frame", "render-video", "remove-keyframe", "get-renderer-info", "set-renderer"];
console.log("NEW_PRESENT:" + expectNew.filter(n => names.includes(n)).join(","));
console.log("NEW_MISSING:" + (expectNew.filter(n => !names.includes(n)).join(",") || "(none)"));

// Exercise bridge-status. No AE/panel watches this throwaway dir, so the correct,
// well-formed answer is panelResponsive:false after the timeout — that proves the
// whole server path runs (writeCommandFile→commandId, clearResultsFile, waitForBridgeResult).
const t0 = Date.now();
const res = await client.callTool({ name: "bridge-status", arguments: { timeoutMs: 1500 } });
console.log("BRIDGE_STATUS:" + res.content[0].text.replace(/\s+/g, " "));
console.log("CALL_MS:" + (Date.now() - t0));

await client.close();
process.exit(0);
