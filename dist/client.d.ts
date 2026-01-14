/**
 * Faramesh Node.js SDK - Production-ready client
 *
 * Provides a complete interface to interact with Faramesh, including:
 * - Submitting actions for governance evaluation
 * - Approving/denying pending actions
 * - Starting action execution
 * - Replaying actions
 * - Listing and querying action history
 * - Loading actions from YAML/JSON files
 */
import { Action, ClientConfig, SubmitActionRequest, ListActionsOptions, FarameshEvent } from "./types";
export declare const __version__ = "0.3.0";
/**
 * Configure the global SDK client
 */
export declare function configure(options?: ClientConfig): void;
/**
 * Submit an action for governance evaluation
 */
export declare function submitAction(agentId: string, tool: string, operation: string, params?: Record<string, any>, context?: Record<string, any>): Promise<Action>;
/**
 * Get an action by ID
 */
export declare function getAction(actionId: string): Promise<Action>;
/**
 * List actions with optional filters
 */
export declare function listActions(options?: ListActionsOptions): Promise<Action[]>;
/**
 * Approve a pending action
 */
export declare function approveAction(actionId: string, token?: string, reason?: string): Promise<Action>;
/**
 * Deny a pending action
 */
export declare function denyAction(actionId: string, token?: string, reason?: string): Promise<Action>;
/**
 * Start execution of an approved or allowed action
 */
export declare function startAction(actionId: string): Promise<Action>;
/**
 * Replay an action by creating a new action with the same parameters
 */
export declare function replayAction(actionId: string): Promise<Action>;
/**
 * Wait for an action to complete (succeeded or failed)
 */
export declare function waitForCompletion(actionId: string, pollInterval?: number, timeout?: number): Promise<Action>;
/**
 * Submit multiple actions in batch
 */
export declare function submitActions(actions: Array<{
    agent_id: string;
    tool: string;
    operation: string;
    params?: Record<string, any>;
    context?: Record<string, any>;
}>): Promise<Array<Action | {
    error: string;
    action_spec: any;
}>>;
/**
 * Stream events via Server-Sent Events (SSE)
 */
export declare function tailEvents(callback?: (event: any) => void, actionId?: string): Promise<void>;
/**
 * Load an action from a YAML or JSON file and submit it
 */
export declare function apply(filePath: string): Promise<Action>;
/**
 * Submit multiple actions in batch with error handling control
 */
export declare function submitActionsBulk(actions: SubmitActionRequest[], options?: {
    raiseOnError?: boolean;
}): Promise<(Action | {
    error: string;
    index: number;
})[]>;
/**
 * Block until an action is approved or denied
 */
export declare function blockUntilApproved(actionId: string, options?: {
    pollIntervalMs?: number;
    timeoutMs?: number;
}): Promise<Action>;
/**
 * Enhanced submit and wait with approval handling
 */
export declare function submitAndWait(config: {
    agentId: string;
    tool: string;
    operation: string;
    params?: any;
    requireApproval?: boolean;
    autoStart?: boolean;
    timeoutMs?: number;
    pollIntervalMs?: number;
}): Promise<Action>;
/**
 * Stream events via Server-Sent Events with advanced options
 */
export declare function onEvents(handler: (event: FarameshEvent) => void, options?: {
    eventTypes?: string[];
    signal?: AbortSignal;
    actionId?: string;
}): () => void;
export declare const allow: typeof approveAction;
export declare const deny: typeof denyAction;
import { GateDecision, ReplayResult } from "./types";
/**
 * Call the gate/decide endpoint to get a decision without creating an action.
 *
 * This is useful for:
 * - Pre-checking if an action would be allowed before committing
 * - Getting deterministic decision data (hashes, versions) for verification
 * - Implementing non-bypassable execution gates
 *
 * @param agentId - Agent identifier
 * @param tool - Tool name (e.g., "http", "shell")
 * @param operation - Operation name (e.g., "get", "run")
 * @param params - Action parameters (default: {})
 * @param context - Additional context (default: {})
 * @returns GateDecision with outcome, reason_code, and version-bound fields
 *
 * @example
 * ```typescript
 * const decision = await gateDecide("agent", "http", "get", { url: "https://example.com" });
 * if (decision.outcome === "EXECUTE") {
 *   console.log("Action would be allowed");
 * } else if (decision.outcome === "HALT") {
 *   console.log(`Action would be denied: ${decision.reason_code}`);
 * }
 * ```
 */
export declare function gateDecide(agentId: string, tool: string, operation: string, params?: Record<string, any>, context?: Record<string, any>): Promise<GateDecision>;
/**
 * Replay a decision to verify determinism.
 *
 * Given an existing action (by ID or provenance_id), re-runs the gate/decide
 * endpoint and compares the results. This verifies that:
 * - The decision outcome matches
 * - Policy/profile/runtime versions match
 * - Hashes are consistent
 *
 * @param options - Either { actionId: string } or { provenanceId: string }
 * @returns ReplayResult with comparison results
 *
 * @example
 * ```typescript
 * const result = await replayDecision({ actionId: "abc123" });
 * if (result.success) {
 *   console.log("Decision replay passed!");
 * } else {
 *   console.log("Mismatches:", result.mismatches);
 * }
 * ```
 */
export declare function replayDecision(options: {
    actionId?: string;
    provenanceId?: string;
}): Promise<ReplayResult>;
/**
 * Verify that a payload produces the expected request_hash.
 *
 * @param payload - Action payload dict
 * @param expectedHash - Expected SHA-256 hash
 * @returns True if hashes match, False otherwise
 *
 * @example
 * ```typescript
 * const action = await submitAction("agent", "http", "get", { url: "..." });
 * const payload = { agent_id: "agent", tool: "http", operation: "get", params: { url: "..." }, context: {} };
 * const matches = verifyRequestHash(payload, action.request_hash!);
 * ```
 */
export declare function verifyRequestHash(payload: Record<string, unknown>, expectedHash: string): boolean;
/**
 * Execute an action only if the gate decision is EXECUTE.
 *
 * This implements a non-bypassable execution gate pattern:
 * 1. Call gate/decide to get decision
 * 2. If outcome is EXECUTE, optionally run the executor
 * 3. Return the decision with execution result
 *
 * @param config - Configuration including agent_id, tool, operation, params, context, and optional executor
 * @returns Object with decision and optional execution result
 *
 * @example
 * ```typescript
 * const result = await executeIfAllowed({
 *   agentId: "agent",
 *   tool: "http",
 *   operation: "get",
 *   params: { url: "https://example.com" },
 *   executor: async (tool, op, params, ctx) => {
 *     // Actually perform the action
 *     return { status: "done" };
 *   }
 * });
 *
 * if (result.executed) {
 *   console.log("Action executed:", result.executionResult);
 * }
 * ```
 */
export declare function executeIfAllowed(config: {
    agentId: string;
    tool: string;
    operation: string;
    params?: Record<string, any>;
    context?: Record<string, any>;
    executor?: (tool: string, operation: string, params: Record<string, any>, context: Record<string, any>) => Promise<any>;
}): Promise<{
    decision: GateDecision;
    outcome: string;
    reasonCode: string;
    executed: boolean;
    executionResult?: any;
    executionError?: string;
}>;
