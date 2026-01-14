"use strict";
/**
 * Governed tool wrapper for Node.js SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.governedTool = governedTool;
const types_1 = require("./types");
const client_1 = require("./client");
/**
 * Wrap a function to submit it to Faramesh for governance
 */
function governedTool(config, fn) {
    const { agentId, tool, operation, blockUntilDone = false, waitTimeoutMs = 60000, pollIntervalMs = 1000, } = config;
    const opName = operation || fn.name;
    return async (...args) => {
        // Submit action with function args/kwargs as params
        const params = {
            args: args.map((a) => String(a)),
            kwargs: {},
        };
        let action = await (0, client_1.submitAction)(agentId, tool, opName, params);
        if (blockUntilDone) {
            // Wait for approval if needed
            if (action.status === "pending_approval") {
                try {
                    action = await (0, client_1.blockUntilApproved)(action.id, {
                        pollIntervalMs,
                        timeoutMs: waitTimeoutMs,
                    });
                }
                catch (error) {
                    if (error instanceof types_1.FarameshDeniedError) {
                        throw error;
                    }
                    throw error;
                }
            }
            // Wait for completion
            if (action.status === "allowed" || action.status === "approved") {
                // Start the action if needed
                action = await (0, client_1.startAction)(action.id);
                // Wait for completion
                action = await (0, client_1.waitForCompletion)(action.id, pollIntervalMs, waitTimeoutMs);
            }
            else if (action.status === "executing") {
                // Already executing, just wait
                action = await (0, client_1.waitForCompletion)(action.id, pollIntervalMs, waitTimeoutMs);
            }
        }
        return action;
    };
}
