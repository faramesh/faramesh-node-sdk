/**
 * TypeScript type definitions for Faramesh SDK
 */
export interface Action {
    id: string;
    agent_id: string;
    tool: string;
    operation: string;
    params: Record<string, any>;
    context: Record<string, any>;
    status: ActionStatus;
    decision: Decision | null;
    reason: string | null;
    risk_level: RiskLevel | null;
    approval_token: string | null;
    policy_version: string | null;
    created_at: string;
    updated_at: string;
    js_example?: string;
    python_example?: string;
    outcome?: DecisionOutcome | null;
    reason_code?: string | null;
    reason_details?: Record<string, any> | null;
    request_hash?: string | null;
    policy_hash?: string | null;
    runtime_version?: string | null;
    profile_id?: string | null;
    profile_version?: string | null;
    profile_hash?: string | null;
    provenance_id?: string | null;
}
export type DecisionOutcome = "EXECUTE" | "ABSTAIN" | "HALT";
export interface GateDecision {
    outcome: DecisionOutcome;
    reason_code: string;
    reason?: string | null;
    request_hash: string;
    policy_version?: string | null;
    policy_hash?: string | null;
    profile_id?: string | null;
    profile_version?: string | null;
    profile_hash?: string | null;
    runtime_version?: string | null;
    provenance_id?: string | null;
}
export interface ReplayResult {
    success: boolean;
    originalOutcome: string;
    replayedOutcome: string;
    originalReasonCode: string;
    replayedReasonCode: string;
    requestHashMatch: boolean;
    policyHashMatch: boolean;
    profileHashMatch: boolean;
    runtimeVersionMatch: boolean;
    mismatches: string[];
}
export type ActionStatus = "allowed" | "pending_approval" | "approved" | "denied" | "executing" | "succeeded" | "failed";
export type Decision = "allow" | "deny" | "require_approval";
export type RiskLevel = "low" | "medium" | "high";
export interface ClientConfig {
    baseUrl?: string;
    token?: string;
    timeoutMs?: number;
    maxRetries?: number;
    retryBackoffFactor?: number;
    onRequestStart?: (method: string, url: string) => void;
    onRequestEnd?: (method: string, url: string, statusCode: number, durationMs: number) => void;
    onError?: (error: Error) => void;
}
export interface SubmitActionRequest {
    agent_id: string;
    tool: string;
    operation: string;
    params?: Record<string, any>;
    context?: Record<string, any>;
}
export interface ListActionsOptions {
    limit?: number;
    offset?: number;
    agent_id?: string;
    tool?: string;
    status?: ActionStatus;
}
export interface ApprovalRequest {
    token: string;
    approve: boolean;
    reason?: string;
}
export declare class FarameshError extends Error {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare class FarameshAuthError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshNotFoundError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshPolicyError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshTimeoutError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshConnectionError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshValidationError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshServerError extends FarameshError {
    constructor(message: string);
}
export declare class FarameshBatchError extends FarameshError {
    successes: Action[];
    errors: Array<{
        error: string;
        index: number;
        actionSpec: any;
    }>;
    constructor(message: string, successes: Action[], errors: Array<{
        error: string;
        index: number;
        actionSpec: any;
    }>);
}
export declare class FarameshDeniedError extends FarameshError {
    constructor(message: string);
}
export interface FarameshEvent {
    event_type?: string;
    type?: string;
    action_id?: string;
    [key: string]: any;
}
