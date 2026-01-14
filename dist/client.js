"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deny = exports.allow = exports.__version__ = void 0;
exports.configure = configure;
exports.submitAction = submitAction;
exports.getAction = getAction;
exports.listActions = listActions;
exports.approveAction = approveAction;
exports.denyAction = denyAction;
exports.startAction = startAction;
exports.replayAction = replayAction;
exports.waitForCompletion = waitForCompletion;
exports.submitActions = submitActions;
exports.tailEvents = tailEvents;
exports.apply = apply;
exports.submitActionsBulk = submitActionsBulk;
exports.blockUntilApproved = blockUntilApproved;
exports.submitAndWait = submitAndWait;
exports.onEvents = onEvents;
exports.gateDecide = gateDecide;
exports.replayDecision = replayDecision;
exports.verifyRequestHash = verifyRequestHash;
exports.executeIfAllowed = executeIfAllowed;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
exports.__version__ = "0.3.0";
// Global configuration
let globalConfig = null;
/**
 * Configure the global SDK client
 */
function configure(options = {}) {
    const existingConfig = globalConfig;
    globalConfig = {
        baseUrl: options.baseUrl || process.env.FARAMESH_BASE_URL || process.env.FARA_API_BASE || "http://127.0.0.1:8000",
        token: options.token || process.env.FARAMESH_TOKEN || process.env.FARA_AUTH_TOKEN,
        timeoutMs: options.timeoutMs || 30000,
        maxRetries: options.maxRetries || parseInt(process.env.FARAMESH_RETRIES || "3", 10),
        retryBackoffFactor: options.retryBackoffFactor || parseFloat(process.env.FARAMESH_RETRY_BACKOFF || "0.5"),
        onRequestStart: options.onRequestStart || existingConfig?.onRequestStart,
        onRequestEnd: options.onRequestEnd || existingConfig?.onRequestEnd,
        onError: options.onError || existingConfig?.onError,
    };
}
function getConfig() {
    if (!globalConfig) {
        configure();
    }
    return globalConfig;
}
function createAxiosInstance(config) {
    const instance = axios_1.default.create({
        baseURL: config.baseUrl.replace(/\/$/, ""),
        timeout: config.timeoutMs,
        headers: {
            "Content-Type": "application/json",
            ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        },
    });
    return instance;
}
async function makeRequest(method, path, data, params) {
    const config = getConfig();
    const client = createAxiosInstance(config);
    const url = path.startsWith("/") ? path : `/${path}`;
    const fullUrl = `${config.baseUrl}${url}`;
    // Call telemetry callback
    if (config.onRequestStart) {
        try {
            config.onRequestStart(method, fullUrl);
        }
        catch (e) {
            // Don't fail on callback errors
        }
    }
    const startTime = Date.now();
    let lastError = null;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const response = await client.request({
                method,
                url,
                data,
                params,
            });
            const durationMs = Date.now() - startTime;
            const responseData = response.data;
            // Check for policy denial (only for submit_action)
            if (method === "POST" &&
                path === "/v1/actions" &&
                responseData &&
                typeof responseData === "object") {
                if (responseData.status === "denied") {
                    const error = new types_1.FarameshPolicyError(responseData.reason || "Action denied by policy");
                    if (config.onError) {
                        try {
                            config.onError(error);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, response.status, durationMs);
                        }
                        catch (e) { }
                    }
                    throw error;
                }
                if (responseData.decision === "deny" &&
                    responseData.status !== "pending_approval") {
                    const error = new types_1.FarameshPolicyError(responseData.reason || "Action denied by policy");
                    if (config.onError) {
                        try {
                            config.onError(error);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, response.status, durationMs);
                        }
                        catch (e) { }
                    }
                    throw error;
                }
            }
            // Call success telemetry callback
            if (config.onRequestEnd) {
                try {
                    config.onRequestEnd(method, fullUrl, response.status, durationMs);
                }
                catch (e) { }
            }
            return responseData;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                // Handle specific status codes
                if (axiosError.response?.status === 401) {
                    const err = new types_1.FarameshAuthError(`Authentication failed (401) on ${path}: ${axiosError.response.data || axiosError.message}`);
                    if (config.onError) {
                        try {
                            config.onError(err);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, 401, durationMs);
                        }
                        catch (e) { }
                    }
                    throw err;
                }
                if (axiosError.response?.status === 404) {
                    const err = new types_1.FarameshNotFoundError(`Resource not found (404) on ${path}`);
                    if (config.onError) {
                        try {
                            config.onError(err);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, 404, durationMs);
                        }
                        catch (e) { }
                    }
                    throw err;
                }
                if (axiosError.response?.status === 422) {
                    const detail = axiosError.response.data?.detail || axiosError.response.data || axiosError.message;
                    const err = new types_1.FarameshValidationError(`Validation error (422) on ${path}: ${detail}`);
                    if (config.onError) {
                        try {
                            config.onError(err);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, 422, durationMs);
                        }
                        catch (e) { }
                    }
                    throw err;
                }
                // Retry on 5xx errors
                if (attempt < config.maxRetries &&
                    axiosError.response?.status &&
                    axiosError.response.status >= 500) {
                    const err = new types_1.FarameshServerError(`Server error (${axiosError.response.status}) on ${path}: ${axiosError.message}`);
                    if (config.onError) {
                        try {
                            config.onError(err);
                        }
                        catch (e) { }
                    }
                    const waitTime = config.retryBackoffFactor * Math.pow(2, attempt) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    lastError = error;
                    continue;
                }
                // Handle timeout
                if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
                    const err = new types_1.FarameshTimeoutError(`Request timed out after ${config.timeoutMs}ms: ${fullUrl}`);
                    if (config.onError) {
                        try {
                            config.onError(err);
                        }
                        catch (e) { }
                    }
                    if (config.onRequestEnd) {
                        try {
                            config.onRequestEnd(method, fullUrl, 0, durationMs);
                        }
                        catch (e) { }
                    }
                    throw err;
                }
                // Handle connection errors
                if (error.code === "ECONNREFUSED" ||
                    error.code === "ENOTFOUND" ||
                    error.code === "ETIMEDOUT") {
                    const err = new types_1.FarameshConnectionError(`Failed to connect to ${config.baseUrl}: ${error.message}`);
                }
                // Other HTTP errors
                const status = axiosError.response?.status || 0;
                const message = axiosError.response?.data?.detail ||
                    axiosError.response?.data ||
                    axiosError.message;
                throw new types_1.FarameshError(`Request failed: ${message}`, status);
            }
            // Re-throw known errors
            if (error instanceof types_1.FarameshAuthError ||
                error instanceof types_1.FarameshNotFoundError ||
                error instanceof types_1.FarameshPolicyError ||
                error instanceof types_1.FarameshValidationError ||
                error instanceof types_1.FarameshTimeoutError ||
                error instanceof types_1.FarameshConnectionError) {
                throw error;
            }
            lastError = error;
            if (attempt < config.maxRetries) {
                const waitTime = config.retryBackoffFactor * Math.pow(2, attempt) * 1000;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                continue;
            }
        }
    }
    if (lastError) {
        throw new types_1.FarameshError(`Request failed after ${config.maxRetries + 1} attempts: ${lastError.message}`);
    }
    const durationMs = Date.now() - startTime;
    const err = new types_1.FarameshError(`Request failed after ${config.maxRetries + 1} attempts on ${path}`);
    if (config.onError) {
        try {
            config.onError(err);
        }
        catch (e) { }
    }
    if (config.onRequestEnd) {
        try {
            config.onRequestEnd(method, fullUrl, 0, durationMs);
        }
        catch (e) { }
    }
    throw err;
}
/**
 * Submit an action for governance evaluation
 */
async function submitAction(agentId, tool, operation, params = {}, context = {}) {
    const payload = {
        agent_id: agentId,
        tool,
        operation,
        params,
        context,
    };
    return makeRequest("POST", "/v1/actions", payload);
}
/**
 * Get an action by ID
 */
async function getAction(actionId) {
    return makeRequest("GET", `/v1/actions/${actionId}`);
}
/**
 * List actions with optional filters
 */
async function listActions(options = {}) {
    const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
    };
    if (options.agent_id)
        params.agent_id = options.agent_id;
    if (options.tool)
        params.tool = options.tool;
    if (options.status)
        params.status = options.status;
    const response = await makeRequest("GET", "/v1/actions", undefined, params);
    if (Array.isArray(response)) {
        return response;
    }
    return response.actions || [];
}
/**
 * Approve a pending action
 */
async function approveAction(actionId, token, reason) {
    if (!token) {
        // Try to get the action first to extract token
        const action = await getAction(actionId);
        if (action.status !== "pending_approval") {
            throw new types_1.FarameshError(`Action ${actionId} is not pending approval (status: ${action.status})`);
        }
        if (!action.approval_token) {
            throw new types_1.FarameshError(`Approval token not found for action ${actionId}`);
        }
        token = action.approval_token;
    }
    const payload = {
        token,
        approve: true,
        ...(reason ? { reason } : {}),
    };
    return makeRequest("POST", `/v1/actions/${actionId}/approval`, payload);
}
/**
 * Deny a pending action
 */
async function denyAction(actionId, token, reason) {
    if (!token) {
        // Try to get the action first to extract token
        const action = await getAction(actionId);
        if (action.status !== "pending_approval") {
            throw new types_1.FarameshError(`Action ${actionId} is not pending approval (status: ${action.status})`);
        }
        if (!action.approval_token) {
            throw new types_1.FarameshError(`Approval token not found for action ${actionId}`);
        }
        token = action.approval_token;
    }
    const payload = {
        token,
        approve: false,
        ...(reason ? { reason } : {}),
    };
    return makeRequest("POST", `/v1/actions/${actionId}/approval`, payload);
}
/**
 * Start execution of an approved or allowed action
 */
async function startAction(actionId) {
    return makeRequest("POST", `/v1/actions/${actionId}/start`);
}
/**
 * Replay an action by creating a new action with the same parameters
 */
async function replayAction(actionId) {
    // Get original action
    const original = await getAction(actionId);
    const status = original.status;
    if (!["allowed", "approved", "succeeded"].includes(status)) {
        throw new types_1.FarameshError(`Cannot replay action ${actionId} with status '${status}'. ` +
            "Only allowed, approved, or succeeded actions can be replayed.");
    }
    // Create new action with same payload
    const context = original.context || {};
    const newContext = {
        ...context,
        replayed_from: actionId,
        replay: true,
    };
    return submitAction(original.agent_id, original.tool, original.operation, original.params || {}, newContext);
}
/**
 * Wait for an action to complete (succeeded or failed)
 */
async function waitForCompletion(actionId, pollInterval = 1000, timeout = 60000) {
    const startTime = Date.now();
    while (true) {
        const action = await getAction(actionId);
        const status = action.status;
        if (["succeeded", "failed", "denied"].includes(status)) {
            return action;
        }
        if (Date.now() - startTime > timeout) {
            throw new types_1.FarameshTimeoutError(`Action ${actionId} did not complete within ${timeout}ms. ` +
                `Current status: ${status}`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
}
/**
 * Submit multiple actions in batch
 */
async function submitActions(actions) {
    const results = [];
    for (const actionSpec of actions) {
        try {
            const result = await submitAction(actionSpec.agent_id, actionSpec.tool, actionSpec.operation, actionSpec.params || {}, actionSpec.context || {});
            results.push(result);
        }
        catch (error) {
            results.push({
                error: error instanceof Error ? error.message : String(error),
                action_spec: actionSpec,
            });
        }
    }
    return results;
}
// Old submitAndWait removed - replaced by enhanced version below
/**
 * Stream events via Server-Sent Events (SSE)
 */
async function tailEvents(callback, actionId) {
    const config = getConfig();
    const url = `${config.baseUrl}/v1/events`;
    // Try to use EventSource (browser) or eventsource package (Node)
    let EventSourceClass;
    // Check if we're in a browser environment
    const isBrowser = typeof globalThis !== "undefined" &&
        typeof globalThis.window !== "undefined";
    if (isBrowser && globalThis.window.EventSource) {
        EventSourceClass = globalThis.window.EventSource;
    }
    else {
        try {
            EventSourceClass = require("eventsource");
        }
        catch {
            throw new types_1.FarameshError("SSE support requires 'eventsource' package. Install with: npm install eventsource");
        }
    }
    return new Promise((resolve, reject) => {
        const headers = {};
        if (config.token) {
            headers["Authorization"] = `Bearer ${config.token}`;
        }
        const eventSource = new EventSourceClass(url, { headers });
        const defaultCallback = (event) => {
            console.log(`Event: ${event.event_type || "unknown"} - ${event.action_id || "N/A"}`);
        };
        const cb = callback || defaultCallback;
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Filter by action_id if specified
                if (actionId && data.action_id !== actionId) {
                    return;
                }
                cb(data);
            }
            catch (error) {
                // Ignore parse errors
            }
        };
        eventSource.onerror = (error) => {
            eventSource.close();
            reject(new types_1.FarameshConnectionError(`Failed to connect to SSE stream: ${error.message || "Unknown error"}`));
        };
        eventSource.onopen = () => {
            // Connection established, but don't resolve - keep streaming
        };
        // Note: This Promise never resolves by design - it streams indefinitely
        // To stop, call eventSource.close() from outside or handle process signals
    });
}
/**
 * Load an action from a YAML or JSON file and submit it
 */
async function apply(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    let data;
    const ext = path.extname(filePath).toLowerCase();
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        if (ext === ".json") {
            data = JSON.parse(content);
        }
        else if (ext === ".yaml" || ext === ".yml") {
            // Try to load yaml if available
            try {
                const yaml = require("yaml");
                data = yaml.parse(content);
            }
            catch (e) {
                throw new types_1.FarameshValidationError("YAML support requires 'yaml' package. Install with: npm install yaml");
            }
        }
        else {
            // Try JSON first, then YAML
            try {
                data = JSON.parse(content);
            }
            catch {
                try {
                    const yaml = require("yaml");
                    data = yaml.parse(content);
                }
                catch (e) {
                    throw new types_1.FarameshValidationError(`Failed to parse file ${filePath}: ${e}`);
                }
            }
        }
    }
    catch (error) {
        if (error instanceof types_1.FarameshValidationError) {
            throw error;
        }
        throw new types_1.FarameshValidationError(`Failed to parse file ${filePath}: ${error}`);
    }
    // Validate required fields
    const required = ["agent_id", "tool", "operation"];
    const missing = required.filter((f) => !(f in data));
    if (missing.length > 0) {
        throw new types_1.FarameshValidationError(`Missing required fields: ${missing.join(", ")}`);
    }
    // Submit action
    return submitAction(data.agent_id, data.tool, data.operation, data.params || {}, data.context || {});
}
/**
 * Submit multiple actions in batch with error handling control
 */
async function submitActionsBulk(actions, options) {
    const raiseOnError = options?.raiseOnError || false;
    const successes = [];
    const errors = [];
    for (let i = 0; i < actions.length; i++) {
        const actionSpec = actions[i];
        try {
            const result = await submitAction(actionSpec.agent_id, actionSpec.tool, actionSpec.operation, actionSpec.params || {}, actionSpec.context || {});
            successes.push(result);
            if (!raiseOnError) {
                // In non-raise mode, include successes in return array
            }
        }
        catch (error) {
            const errorEntry = {
                error: error.message || String(error),
                index: i,
                actionSpec,
            };
            errors.push(errorEntry);
            if (!raiseOnError) {
                successes.push(errorEntry);
            }
        }
    }
    if (raiseOnError && errors.length > 0) {
        throw new types_1.FarameshBatchError(`Batch submission failed: ${errors.length} of ${actions.length} actions failed`, successes, errors);
    }
    return successes;
}
/**
 * Block until an action is approved or denied
 */
async function blockUntilApproved(actionId, options) {
    const pollIntervalMs = options?.pollIntervalMs || 2000;
    const timeoutMs = options?.timeoutMs || 300000;
    const startTime = Date.now();
    while (true) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeoutMs) {
            throw new types_1.FarameshTimeoutError(`Timeout waiting for approval after ${timeoutMs}ms`);
        }
        const action = await getAction(actionId);
        const status = action.status;
        if (status === "approved") {
            return action;
        }
        else if (status === "denied") {
            const reason = action.reason || "Action denied";
            throw new types_1.FarameshDeniedError(`Action denied: ${reason}`);
        }
        else if (status === "allowed" || status === "succeeded" || status === "failed") {
            // Already processed, return as-is
            return action;
        }
        // Still pending, wait and poll again
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
}
/**
 * Enhanced submit and wait with approval handling
 */
async function submitAndWait(config) {
    const { agentId, tool, operation, params = {}, requireApproval = false, autoStart = false, timeoutMs = 300000, pollIntervalMs = 1000, } = config;
    // Submit action
    let action = await submitAction(agentId, tool, operation, params);
    let status = action.status;
    // If denied, raise immediately
    if (status === "denied") {
        const reason = action.reason || "Action denied by policy";
        throw new types_1.FarameshDeniedError(`Action denied: ${reason}`);
    }
    // If pending approval
    if (status === "pending_approval") {
        if (requireApproval) {
            // Wait for approval
            action = await blockUntilApproved(action.id, {
                pollIntervalMs,
                timeoutMs,
            });
            status = action.status;
        }
        else {
            // Return immediately if not requiring approval
            return action;
        }
    }
    // If allowed and autoStart, start and wait
    if (status === "allowed" && autoStart) {
        action = await startAction(action.id);
        return waitForCompletion(action.id, pollIntervalMs, timeoutMs);
    }
    // If already approved and autoStart, start and wait
    if (status === "approved" && autoStart) {
        action = await startAction(action.id);
        return waitForCompletion(action.id, pollIntervalMs, timeoutMs);
    }
    // Otherwise return as-is
    return action;
}
/**
 * Stream events via Server-Sent Events with advanced options
 */
function onEvents(handler, options) {
    const config = getConfig();
    const url = `${config.baseUrl}/v1/events`;
    // Try to use EventSource (browser) or eventsource package (Node)
    let EventSourceClass;
    const isBrowser = typeof globalThis !== "undefined" &&
        typeof globalThis.window !== "undefined";
    if (isBrowser && globalThis.window.EventSource) {
        EventSourceClass = globalThis.window.EventSource;
    }
    else {
        try {
            EventSourceClass = require("eventsource");
        }
        catch {
            throw new types_1.FarameshError("SSE support requires 'eventsource' package. Install with: npm install eventsource");
        }
    }
    const headers = {};
    if (config.token) {
        headers["Authorization"] = `Bearer ${config.token}`;
    }
    const eventSource = new EventSourceClass(url, { headers });
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            // Filter by action_id if specified
            if (options?.actionId && data.action_id !== options.actionId) {
                return;
            }
            // Filter by event_types if specified
            if (options?.eventTypes) {
                const eventType = data.event_type || data.type;
                if (!eventType || !options.eventTypes.includes(eventType)) {
                    return;
                }
            }
            handler(data);
        }
        catch (error) {
            // Ignore parse errors
        }
    };
    eventSource.onerror = (error) => {
        eventSource.close();
        if (config.onError) {
            try {
                config.onError(new types_1.FarameshConnectionError(`SSE stream error: ${error.message || "Unknown error"}`));
            }
            catch (e) { }
        }
    };
    // Handle AbortSignal if provided
    if (options?.signal) {
        options.signal.addEventListener("abort", () => {
            eventSource.close();
        });
    }
    // Return close function
    return () => {
        eventSource.close();
    };
}
// Convenience aliases
exports.allow = approveAction;
exports.deny = denyAction;
const canonicalization_1 = require("./canonicalization");
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
async function gateDecide(agentId, tool, operation, params = {}, context = {}) {
    const payload = {
        agent_id: agentId,
        tool,
        operation,
        params,
        context,
    };
    return makeRequest("POST", "/v1/gate/decide", payload);
}
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
async function replayDecision(options) {
    const { actionId, provenanceId } = options;
    if (!actionId && !provenanceId) {
        throw new types_1.FarameshError("Must provide either actionId or provenanceId");
    }
    let original;
    if (provenanceId) {
        // Search for action by provenance_id
        const actions = await listActions({ limit: 1000 });
        const matches = actions.filter((a) => a.provenance_id === provenanceId);
        if (matches.length === 0) {
            throw new types_1.FarameshNotFoundError(`No action found with provenance_id '${provenanceId}'`);
        }
        original = matches[0];
    }
    else {
        original = await getAction(actionId);
    }
    // Call gate/decide
    const replayed = await gateDecide(original.agent_id, original.tool, original.operation, original.params || {}, original.context || {});
    // Compare results
    const mismatches = [];
    const originalOutcome = original.outcome || "";
    const replayedOutcome = replayed.outcome || "";
    if (originalOutcome !== replayedOutcome) {
        mismatches.push(`outcome: ${originalOutcome} != ${replayedOutcome}`);
    }
    const originalReasonCode = original.reason_code || "";
    const replayedReasonCode = replayed.reason_code || "";
    if (originalReasonCode !== replayedReasonCode) {
        mismatches.push(`reason_code: ${originalReasonCode} != ${replayedReasonCode}`);
    }
    const requestHashMatch = original.request_hash === replayed.request_hash;
    if (!requestHashMatch) {
        mismatches.push("request_hash mismatch");
    }
    const policyHashMatch = original.policy_hash === replayed.policy_hash;
    if (!policyHashMatch) {
        mismatches.push("policy_hash mismatch (policy may have changed)");
    }
    const profileHashMatch = original.profile_hash === replayed.profile_hash;
    if (!profileHashMatch) {
        mismatches.push("profile_hash mismatch (profile may have changed)");
    }
    const runtimeVersionMatch = original.runtime_version === replayed.runtime_version;
    if (!runtimeVersionMatch) {
        mismatches.push(`runtime_version: ${original.runtime_version} != ${replayed.runtime_version}`);
    }
    return {
        success: mismatches.length === 0,
        originalOutcome,
        replayedOutcome,
        originalReasonCode,
        replayedReasonCode,
        requestHashMatch,
        policyHashMatch,
        profileHashMatch,
        runtimeVersionMatch,
        mismatches,
    };
}
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
function verifyRequestHash(payload, expectedHash) {
    const computed = (0, canonicalization_1.computeRequestHash)(payload);
    return computed === expectedHash;
}
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
async function executeIfAllowed(config) {
    const { agentId, tool, operation, params = {}, context = {}, executor } = config;
    const decision = await gateDecide(agentId, tool, operation, params, context);
    const result = {
        decision,
        outcome: decision.outcome,
        reasonCode: decision.reason_code,
        executed: false,
        executionResult: undefined,
    };
    if (decision.outcome === "EXECUTE" && executor) {
        try {
            const executionResult = await executor(tool, operation, params, context);
            result.executed = true;
            result.executionResult = executionResult;
        }
        catch (error) {
            result.executionError = error.message || String(error);
        }
    }
    return result;
}
