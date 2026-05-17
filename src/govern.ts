/**
 * Strict gate helper: returns only on allow; throws DenyError / DeferredError otherwise.
 * Also provides a simplified `govern()` for the autopatcher that uses
 * Unix domain socket or HTTP fallback.
 */

import { gateDecide } from "./client";
import { ToolDeniedException } from "./exceptions";
import { detectTransport, governViaTransport } from "./transport";
import { DeferredError, DenyError, GateDecision } from "./types";

export interface GovernResult {
  effect: "PERMIT" | "DENY" | "DEFER";
  reasonCode?: string;
  deferToken?: string;
  structuredDenial?: import("./exceptions").StructuredDenial;
}

export interface GovernRequest {
  toolId: string;
  args: Record<string, any>;
  agentId?: string;
}

/**
 * Call gate/decide and return only when execution would be allowed.
 *
 * - **EXECUTE** / **PERMIT**: returns decision.
 * - **HALT** / **DENY**: throws {@link DenyError}.
 * - **ABSTAIN** / **DEFER** / **PENDING**: throws {@link DeferredError}.
 */
export async function gateGovern(
  agentId: string,
  tool: string,
  operation: string,
  params: Record<string, any> = {},
  context: Record<string, any> = {}
): Promise<GateDecision> {
  const d = await gateDecide(agentId, tool, operation, params, context);
  const o = (d.outcome || "").toUpperCase();
  if (o === "EXECUTE" || o === "PERMIT") {
    return d;
  }
  if (o === "HALT" || o === "DENY") {
    throw new DenyError(
      `governance denied: ${d.reason_code || "unknown"}`,
      d.reason_code || "",
      d.reason ?? undefined,
      d
    );
  }
  if (o === "ABSTAIN" || o === "DEFER" || o === "PENDING") {
    throw new DeferredError(
      `governance deferred: ${d.reason_code || "unknown"}`,
      d.reason_code || "",
      d.reason ?? undefined,
      d
    );
  }
  throw new Error(`unexpected gate outcome: ${d.outcome}`);
}

/**
 * Simplified governance call used by the autopatcher.
 * Tries Unix socket first, falls back to HTTP.
 */
export async function govern(req: GovernRequest): Promise<GovernResult> {
  const agentId = req.agentId || process.env.FARAMESH_AGENT_ID || "auto-patched";
  try {
    const transport = detectTransport();
    const result = await governViaTransport(transport, req.toolId, req.args, agentId);
    const effect = (result.effect || "PERMIT").toUpperCase() as GovernResult["effect"];
    return {
      effect,
      reasonCode: result.reason_code,
      deferToken: result.defer_token,
      structuredDenial: result.structured_denial,
    };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("no governance transport")
    ) {
      // HTTP gate fallback for legacy deployments.
      const parts = req.toolId.split("/");
      const tool = parts.length > 1 ? parts.slice(0, -1).join("/") : req.toolId;
      const operation = parts.length > 1 ? parts[parts.length - 1] : "invoke";
      const d = await gateDecide(agentId, tool, operation, req.args);
      const o = (d.outcome || "").toUpperCase();
      if (o === "EXECUTE" || o === "PERMIT") return { effect: "PERMIT" };
      if (o === "HALT" || o === "DENY")
        return { effect: "DENY", reasonCode: d.reason_code };
      if (o === "ABSTAIN" || o === "DEFER" || o === "PENDING")
        return { effect: "DEFER", deferToken: d.provenance_id || "" };
    }
    throw err;
  }
}

export { ToolDeniedException };
