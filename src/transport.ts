/**
 * Governance transport: Unix socket (faramesh dev/apply) or HTTPS remote evaluate.
 */

import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";

import type { StructuredDenial } from "./exceptions";

export interface Transport {
  mode: "socket" | "remote";
  socketPath?: string;
  remoteURL?: string;
  token?: string;
}

export interface GovernTransportResult {
  effect: string;
  reason_code?: string;
  defer_token?: string;
  structured_denial?: StructuredDenial;
}

export function defaultSocketPath(): string {
  return (
    process.env.FARAMESH_SOCKET?.trim() ||
    path.join(os.homedir(), ".faramesh", "runtime", "faramesh.sock")
  );
}

export function detectTransport(): Transport {
  const remote = (process.env.FARAMESH_REMOTE_URL || "").trim().replace(/\/$/, "");
  if (remote) {
    return {
      mode: "remote",
      remoteURL: remote,
      token: (process.env.FARAMESH_TOKEN || "").trim(),
    };
  }
  const socketPath = defaultSocketPath();
  try {
    fs.accessSync(socketPath, fs.constants.F_OK);
    return { mode: "socket", socketPath };
  } catch {
    const base = (process.env.FARAMESH_BASE_URL || "").trim().replace(/\/$/, "");
    if (base) {
      return {
        mode: "remote",
        remoteURL: base,
        token: (process.env.FARAMESH_TOKEN || "").trim(),
      };
    }
    throw new Error(
      `no governance transport: set FARAMESH_SOCKET (${socketPath} missing) or FARAMESH_REMOTE_URL`
    );
  }
}

export async function governViaTransport(
  transport: Transport,
  toolId: string,
  args: Record<string, unknown>,
  agentId?: string,
  actionType = "tool_call"
): Promise<GovernTransportResult> {
  const resolvedAgent = agentId || process.env.FARAMESH_AGENT_ID || "auto-patched";
  const parts = toolId.includes("/") ? toolId.split("/") : [toolId, "invoke"];
  const tool = parts.length > 1 ? parts.slice(0, -1).join("/") : parts[0];
  const operation = parts.length > 1 ? parts[parts.length - 1] : "invoke";
  if (transport.mode === "remote") {
    return governRemote(transport, resolvedAgent, tool, operation, args, actionType);
  }
  return governSocket(transport.socketPath || defaultSocketPath(), resolvedAgent, tool, operation, args, actionType);
}

async function governRemote(
  transport: Transport,
  agentId: string,
  tool: string,
  operation: string,
  args: Record<string, unknown>,
  actionType: string
): Promise<GovernTransportResult> {
  if (!transport.remoteURL) {
    throw new Error("remote transport not configured");
  }
  const res = await fetch(`${transport.remoteURL}/v1/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(transport.token ? { Authorization: `Bearer ${transport.token}` } : {}),
    },
    body: JSON.stringify({
      agent_id: agentId,
      tool_id: `${tool}/${operation}`,
      action_type: actionType,
      args,
    }),
  });
  if (!res.ok) {
    throw new Error(`remote evaluate: HTTP ${res.status}`);
  }
  const decision = (await res.json()) as Record<string, unknown>;
  const effect = String(decision.effect || decision.outcome || "").toUpperCase();
  const out: GovernTransportResult = {
    effect,
    reason_code: String(decision.reason_code ?? ""),
    defer_token: String(decision.defer_token ?? decision.provenance_id ?? ""),
  };
  if (decision.structured_denial && typeof decision.structured_denial === "object") {
    out.structured_denial = decision.structured_denial as StructuredDenial;
  }
  return out;
}

export function governSocket(
  socketPath: string,
  agentId: string,
  tool: string,
  operation: string,
  args: Record<string, unknown>,
  actionType = "tool_call"
): Promise<GovernTransportResult> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "govern",
    params: {
      agent_id: agentId,
      tool,
      operation,
      tool_id: tool,
      args,
      action_type: actionType,
      principal_token: process.env.FARAMESH_PRINCIPAL_TOKEN || "",
    },
  };
  return new Promise((resolve, reject) => {
    const conn = net.createConnection(socketPath, () => {
      conn.write(JSON.stringify(payload) + "\n");
    });
    let buf = "";
    conn.on("data", (chunk) => {
      buf += chunk.toString();
    });
    conn.on("end", () => {
      try {
        const resp = JSON.parse(buf) as {
          result?: GovernTransportResult & { structured_denial?: StructuredDenial };
          error?: { message?: string };
        };
        if (resp.error) {
          reject(new Error(`socket govern: ${resp.error.message || "unknown"}`));
          return;
        }
        const result = resp.result || { effect: "" };
        resolve({
          effect: String(result.effect || "").toUpperCase(),
          reason_code: result.reason_code,
          defer_token: result.defer_token,
          structured_denial: result.structured_denial,
        });
      } catch (err) {
        reject(err);
      }
    });
    conn.on("error", reject);
    conn.setTimeout(30_000, () => {
      conn.destroy();
      reject(new Error("socket govern timeout"));
    });
  });
}
