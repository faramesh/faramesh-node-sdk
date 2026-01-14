/**
 * Governed tool wrapper for Node.js SDK
 */
import { Action } from "./types";
export interface GovernedToolConfig {
    agentId: string;
    tool: string;
    operation?: string;
    blockUntilDone?: boolean;
    waitTimeoutMs?: number;
    pollIntervalMs?: number;
}
/**
 * Wrap a function to submit it to Faramesh for governance
 */
export declare function governedTool<T extends (...args: any[]) => any>(config: GovernedToolConfig, fn: T): (...args: Parameters<T>) => Promise<Action>;
