/**
 * Deterministic canonicalization for Faramesh client-side hashing.
 *
 * This module mirrors the canonicalization logic in faramesh-core to enable
 * clients to compute request_hash locally before submitting actions.
 *
 * @example
 * ```typescript
 * import { computeRequestHash } from "@faramesh/sdk";
 *
 * const payload = { agent_id: "test", tool: "http", operation: "get", params: {} };
 * const hash = computeRequestHash(payload);
 * ```
 */
/**
 * Error thrown when canonicalization fails.
 */
export declare class CanonicalizeError extends Error {
    constructor(message: string);
}
/**
 * Canonicalize an object to a deterministic JSON string.
 *
 * Guarantees:
 * - Dict keys sorted lexicographically
 * - Arrays preserve order
 * - UTF-8 compatible (ensure_ascii=false)
 * - No NaN, Infinity, -Infinity
 * - Floats normalized: no exponent, no trailing zeros
 *
 * @param obj - Any JSON-serializable object
 * @returns Canonical JSON string
 * @throws CanonicalizeError if canonicalization fails
 */
export declare function canonicalize(obj: unknown): string;
/**
 * Canonicalize an action payload for hashing.
 *
 * Drops ephemeral/internal fields (id, approval_token, timestamps, etc.)
 * and produces canonical string.
 *
 * @param payload - Action payload with agent_id, tool, operation, params, context
 * @returns Canonical string representation
 * @throws CanonicalizeError if canonicalization fails
 */
export declare function canonicalizeActionPayload(payload: Record<string, unknown>): string;
/**
 * Compute SHA-256 hash of canonicalized action payload.
 *
 * This produces the same hash as the Faramesh server, enabling
 * clients to verify request_hash matches before/after submission.
 *
 * @param payload - Action payload dict (agent_id, tool, operation, params, context)
 * @returns SHA-256 hex digest (64 characters)
 * @throws CanonicalizeError if canonicalization fails
 *
 * @example
 * ```typescript
 * const payload = {
 *   agent_id: "test",
 *   tool: "http",
 *   operation: "get",
 *   params: { url: "https://example.com" },
 *   context: {}
 * };
 * const hash = computeRequestHash(payload);
 * console.log(hash); // 64-char hex string
 * ```
 */
export declare function computeRequestHash(payload: Record<string, unknown>): string;
/**
 * Compute SHA-256 hash of the canonical JSON representation.
 *
 * @param obj - Any JSON-serializable object
 * @returns SHA-256 hex digest (64 characters)
 * @throws CanonicalizeError if canonicalization fails
 */
export declare function computeHash(obj: unknown): string;
