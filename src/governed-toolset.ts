/**
 * GovernedToolSet — wrap LangChain / callable tools with daemon interception.
 */

import { ToolDeniedException } from "./exceptions";
import { detectTransport, governViaTransport } from "./transport";

export type ToolLike = Record<string, unknown> | ((...args: unknown[]) => unknown);

function toolName(tool: ToolLike): string {
  if (typeof tool === "function") {
    return tool.name || "tool";
  }
  const t = tool as { name?: string };
  return String(t.name ?? "tool");
}

function parseGovernResult(result: {
  effect?: string;
  reason_code?: string;
  defer_token?: string;
  structured_denial?: import("./exceptions").StructuredDenial;
}): void {
  const effect = String(result.effect || "").toUpperCase();
  if (["PERMIT", "ALLOW", "EXECUTE"].includes(effect)) {
    return;
  }
  if (["DENY", "DEFER", "HALT", "BLOCK", "ABSTAIN", "PENDING"].includes(effect)) {
    throw ToolDeniedException.fromGovernResult(result);
  }
  throw new ToolDeniedException(`unknown governance effect: ${effect}`, {
    code: "GOVERNANCE_ERROR",
    effect,
  });
}

async function governCall(
  agentId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<void> {
  const transport = detectTransport();
  const toolId = toolName.includes("/") ? toolName : `${toolName}/invoke`;
  const result = await governViaTransport(transport, toolId, args, agentId);
  parseGovernResult(result);
}

function wrapCallable<T extends (...args: unknown[]) => unknown>(
  agentId: string,
  fn: T,
  name: string
): T {
  const wrapped = async (...args: unknown[]) => {
    await governCall(agentId, name, { args, kwargs: {} });
    return fn(...args);
  };
  return wrapped as T;
}

function wrapLangChainTool(agentId: string, tool: Record<string, unknown>): Record<string, unknown> {
  const name = toolName(tool);
  const origInvoke = tool.invoke as
    | ((input: unknown, config?: unknown) => Promise<unknown>)
    | undefined;
  if (typeof origInvoke === "function") {
    tool.invoke = async (input: unknown, config?: unknown) => {
      const args =
        input && typeof input === "object" && !Array.isArray(input)
          ? (input as Record<string, unknown>)
          : { input };
      await governCall(agentId, name, args);
      return origInvoke.call(tool, input, config);
    };
  }
  return tool;
}

export class GovernedToolSet extends Array<unknown> {
  readonly agentId: string;

  constructor(tools: Iterable<ToolLike>, opts: { agentId?: string } = {}) {
    const resolved = (opts.agentId || process.env.FARAMESH_AGENT_ID || "").trim();
    if (!resolved) {
      throw new Error("agentId is required (pass agentId or set FARAMESH_AGENT_ID)");
    }
    const wrapped: unknown[] = [];
    for (const tool of tools) {
      if (typeof tool === "function") {
        wrapped.push(wrapCallable(resolved, tool, toolName(tool)));
      } else {
        wrapped.push(wrapLangChainTool(resolved, { ...tool }));
      }
    }
    super(...wrapped);
    this.agentId = resolved;
  }
}
