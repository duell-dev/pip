import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Codex } from "@openai/codex-sdk";

const expected = { items: [
  { id: "a", type: "task", area: "personal", due_date: "2026-10-08" },
  { id: "b", type: "note", area: "dayjob", due_date: null },
  { id: "c", type: "resource", area: "sidehustle", due_date: null },
] };
const schema = {
  type: "object", additionalProperties: false, required: ["items"],
  properties: { items: { type: "array", items: {
    type: "object", additionalProperties: false,
    required: ["id", "type", "area", "due_date"],
    properties: {
      id: { type: "string", enum: ["a", "b", "c"] },
      type: { type: "string", enum: ["task", "note", "resource"] },
      area: { type: "string", enum: ["personal", "dayjob", "sidehustle"] },
      due_date: { type: ["string", "null"] },
    },
  } } },
};
const prompt = `Classify these three synthetic items. Return only the requested JSON.
Use only the text below; do not use tools, browse, read files or take actions.
Preserve explicit deadlines as YYYY-MM-DD; otherwise use null.
a: Personal task: book a dentist appointment by 2026-10-08.
b: Dayjob note: the staging database has already been upgraded.
c: Sidehustle resource: save this tutorial for later: https://example.com/tutorial`;

// Keep authentication with the official CLI, and prevent an API-key fallback.
function subscriptionEnvironment(source) {
  return Object.fromEntries(Object.entries(source).filter(([key, value]) =>
    value !== undefined && !/^(OPENAI_API_KEY|CODEX_API_KEY|CODEX_ACCESS_TOKEN|OPENAI_BASE_URL|OPENAI_API_BASE)$/i.test(key)));
}

function verifyResult(turn) {
  assert.ok(turn.usage, "Missing turn.completed usage; reject incomplete output");
  assert.ok(turn.items.every(item => ["agent_message", "reasoning"].includes(item.type)),
    "Expected a classification without tools or errors");
  const result = JSON.parse(turn.finalResponse);
  assert.deepEqual(Object.keys(result), ["items"]);
  assert.ok(Array.isArray(result.items));
  result.items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  assert.deepEqual(result, expected, "Classification did not match the synthetic fixture");
  return result;
}

async function main() {
  if (process.argv[2] === "--self-test") {
    const turn = { items: [], finalResponse: JSON.stringify(expected), usage: { input_tokens: 1 } };
    assert.deepEqual(verifyResult(turn), expected);
    assert.throws(() => verifyResult({ ...turn, usage: null }));
    assert.throws(() => verifyResult({ ...turn, finalResponse: '{"items":[]}' }));
    assert.throws(() => verifyResult({ ...turn, items: [{ type: "command_execution" }] }));
    assert.deepEqual(subscriptionEnvironment({ PATH: "ok", OPENAI_API_KEY: "secret", codex_api_key: "secret" }), { PATH: "ok" });
    console.log("Self-check passed: incomplete/incorrect/tool results and API-key fallback rejected.");
    return;
  }
  assert.equal(process.argv.length, 2, "Usage: node codex-check.mjs [--self-test]");
  const env = subscriptionEnvironment(process.env);
  const binary = process.env.COMPANION_CODEX_BINARY || "codex";
  const login = spawnSync(binary, ["login", "status"], {
    env, encoding: "utf8", windowsHide: true, timeout: 15_000,
  });
  assert.ok(login.status === 0 && /Logged in using ChatGPT/.test(`${login.stdout}${login.stderr}`),
    "ChatGPT login required. Run the official 'codex login' command, then retry.");
  const version = spawnSync(binary, ["--version"], { env, encoding: "utf8", windowsHide: true, timeout: 15_000 });
  assert.equal(version.status, 0, "Could not determine Codex version");
  const workingDirectory = fileURLToPath(new URL("./scratch/", import.meta.url));
  await mkdir(workingDirectory, { recursive: true });
  const codex = new Codex({
    codexPathOverride: binary, env,
    config: {
      forced_login_method: "chatgpt", model_provider: "openai",
      features: { shell_tool: false },
      apps: { _default: { enabled: false } },
    },
  });
  const thread = codex.startThread({
    workingDirectory, skipGitRepoCheck: true,
    sandboxMode: "read-only", approvalPolicy: "never",
    webSearchMode: "disabled", networkAccessEnabled: false,
  });
  console.log("Sending one synthetic classification through the official Codex SDK (ChatGPT login).");
  const turn = await thread.run(prompt, { outputSchema: schema, signal: AbortSignal.timeout(120_000) });
  const result = {
    checkedAt: new Date().toISOString(), sdkVersion: "0.160.0",
    cliVersion: version.stdout.trim(), authentication: "chatgpt",
    classification: verifyResult(turn), usage: turn.usage,
    additionalBillingVerified: false,
  };
  await writeFile(new URL("./codex-result.local.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
