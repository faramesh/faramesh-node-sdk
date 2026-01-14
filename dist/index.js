"use strict";
/**
 * Faramesh Node.js SDK
 *
 * Production-ready client for the Faramesh Execution Governor API
 *
 * @example
 * ```typescript
 * import { configure, submitAction, approveAction } from '@faramesh/sdk';
 *
 * configure({ baseUrl: 'http://localhost:8000', token: 'dev-token' });
 *
 * const action = await submitAction('my-agent', 'http', 'get', { url: 'https://example.com' });
 * console.log(`Action ${action.id} status: ${action.status}`);
 * ```
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolicy = exports.policyToDict = exports.policyToYaml = exports.validatePolicy = exports.testPolicyAgainstAction = exports.validatePolicyFile = exports.getDefaultStore = exports.ActionSnapshotStore = exports.governedTool = exports.CanonicalizeError = exports.computeHash = exports.computeRequestHash = exports.canonicalizeActionPayload = exports.canonicalize = exports.FarameshDeniedError = exports.FarameshBatchError = exports.FarameshServerError = exports.FarameshValidationError = exports.FarameshConnectionError = exports.FarameshTimeoutError = exports.FarameshPolicyError = exports.FarameshNotFoundError = exports.FarameshAuthError = exports.FarameshError = exports.executeIfAllowed = exports.verifyRequestHash = exports.replayDecision = exports.gateDecide = exports.__version__ = exports.deny = exports.allow = exports.onEvents = exports.tailEvents = exports.apply = exports.waitForCompletion = exports.replayAction = exports.startAction = exports.denyAction = exports.approveAction = exports.listActions = exports.getAction = exports.blockUntilApproved = exports.submitAndWait = exports.submitActionsBulk = exports.submitActions = exports.submitAction = exports.configure = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "configure", { enumerable: true, get: function () { return client_1.configure; } });
Object.defineProperty(exports, "submitAction", { enumerable: true, get: function () { return client_1.submitAction; } });
Object.defineProperty(exports, "submitActions", { enumerable: true, get: function () { return client_1.submitActions; } });
Object.defineProperty(exports, "submitActionsBulk", { enumerable: true, get: function () { return client_1.submitActionsBulk; } });
Object.defineProperty(exports, "submitAndWait", { enumerable: true, get: function () { return client_1.submitAndWait; } });
Object.defineProperty(exports, "blockUntilApproved", { enumerable: true, get: function () { return client_1.blockUntilApproved; } });
Object.defineProperty(exports, "getAction", { enumerable: true, get: function () { return client_1.getAction; } });
Object.defineProperty(exports, "listActions", { enumerable: true, get: function () { return client_1.listActions; } });
Object.defineProperty(exports, "approveAction", { enumerable: true, get: function () { return client_1.approveAction; } });
Object.defineProperty(exports, "denyAction", { enumerable: true, get: function () { return client_1.denyAction; } });
Object.defineProperty(exports, "startAction", { enumerable: true, get: function () { return client_1.startAction; } });
Object.defineProperty(exports, "replayAction", { enumerable: true, get: function () { return client_1.replayAction; } });
Object.defineProperty(exports, "waitForCompletion", { enumerable: true, get: function () { return client_1.waitForCompletion; } });
Object.defineProperty(exports, "apply", { enumerable: true, get: function () { return client_1.apply; } });
Object.defineProperty(exports, "tailEvents", { enumerable: true, get: function () { return client_1.tailEvents; } });
Object.defineProperty(exports, "onEvents", { enumerable: true, get: function () { return client_1.onEvents; } });
Object.defineProperty(exports, "allow", { enumerable: true, get: function () { return client_1.allow; } });
Object.defineProperty(exports, "deny", { enumerable: true, get: function () { return client_1.deny; } });
Object.defineProperty(exports, "__version__", { enumerable: true, get: function () { return client_1.__version__; } });
// Gate/Replay helpers
Object.defineProperty(exports, "gateDecide", { enumerable: true, get: function () { return client_1.gateDecide; } });
Object.defineProperty(exports, "replayDecision", { enumerable: true, get: function () { return client_1.replayDecision; } });
Object.defineProperty(exports, "verifyRequestHash", { enumerable: true, get: function () { return client_1.verifyRequestHash; } });
Object.defineProperty(exports, "executeIfAllowed", { enumerable: true, get: function () { return client_1.executeIfAllowed; } });
var types_1 = require("./types");
Object.defineProperty(exports, "FarameshError", { enumerable: true, get: function () { return types_1.FarameshError; } });
Object.defineProperty(exports, "FarameshAuthError", { enumerable: true, get: function () { return types_1.FarameshAuthError; } });
Object.defineProperty(exports, "FarameshNotFoundError", { enumerable: true, get: function () { return types_1.FarameshNotFoundError; } });
Object.defineProperty(exports, "FarameshPolicyError", { enumerable: true, get: function () { return types_1.FarameshPolicyError; } });
Object.defineProperty(exports, "FarameshTimeoutError", { enumerable: true, get: function () { return types_1.FarameshTimeoutError; } });
Object.defineProperty(exports, "FarameshConnectionError", { enumerable: true, get: function () { return types_1.FarameshConnectionError; } });
Object.defineProperty(exports, "FarameshValidationError", { enumerable: true, get: function () { return types_1.FarameshValidationError; } });
Object.defineProperty(exports, "FarameshServerError", { enumerable: true, get: function () { return types_1.FarameshServerError; } });
Object.defineProperty(exports, "FarameshBatchError", { enumerable: true, get: function () { return types_1.FarameshBatchError; } });
Object.defineProperty(exports, "FarameshDeniedError", { enumerable: true, get: function () { return types_1.FarameshDeniedError; } });
// Canonicalization helpers
var canonicalization_1 = require("./canonicalization");
Object.defineProperty(exports, "canonicalize", { enumerable: true, get: function () { return canonicalization_1.canonicalize; } });
Object.defineProperty(exports, "canonicalizeActionPayload", { enumerable: true, get: function () { return canonicalization_1.canonicalizeActionPayload; } });
Object.defineProperty(exports, "computeRequestHash", { enumerable: true, get: function () { return canonicalization_1.computeRequestHash; } });
Object.defineProperty(exports, "computeHash", { enumerable: true, get: function () { return canonicalization_1.computeHash; } });
Object.defineProperty(exports, "CanonicalizeError", { enumerable: true, get: function () { return canonicalization_1.CanonicalizeError; } });
var governed_tool_1 = require("./governed-tool");
Object.defineProperty(exports, "governedTool", { enumerable: true, get: function () { return governed_tool_1.governedTool; } });
var snapshot_1 = require("./snapshot");
Object.defineProperty(exports, "ActionSnapshotStore", { enumerable: true, get: function () { return snapshot_1.ActionSnapshotStore; } });
Object.defineProperty(exports, "getDefaultStore", { enumerable: true, get: function () { return snapshot_1.getDefaultStore; } });
var policy_helpers_1 = require("./policy-helpers");
Object.defineProperty(exports, "validatePolicyFile", { enumerable: true, get: function () { return policy_helpers_1.validatePolicyFile; } });
Object.defineProperty(exports, "testPolicyAgainstAction", { enumerable: true, get: function () { return policy_helpers_1.testPolicyAgainstAction; } });
var policy_1 = require("./policy");
Object.defineProperty(exports, "validatePolicy", { enumerable: true, get: function () { return policy_1.validatePolicy; } });
Object.defineProperty(exports, "policyToYaml", { enumerable: true, get: function () { return policy_1.policyToYaml; } });
Object.defineProperty(exports, "policyToDict", { enumerable: true, get: function () { return policy_1.policyToDict; } });
Object.defineProperty(exports, "createPolicy", { enumerable: true, get: function () { return policy_1.createPolicy; } });
// Default export for CommonJS compatibility
const SDK = __importStar(require("./client"));
exports.default = SDK;
