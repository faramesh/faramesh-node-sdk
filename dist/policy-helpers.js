"use strict";
/**
 * Policy validation and testing helpers
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
exports.validatePolicyFile = validatePolicyFile;
exports.testPolicyAgainstAction = testPolicyAgainstAction;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
/**
 * Validate a policy YAML/JSON file
 */
async function validatePolicyFile(policyPath) {
    if (!fs.existsSync(policyPath)) {
        throw new types_1.FarameshError(`Policy file not found: ${policyPath}`);
    }
    let content;
    try {
        content = fs.readFileSync(policyPath, "utf-8");
    }
    catch (error) {
        throw new types_1.FarameshError(`Failed to read policy file: ${error.message}`);
    }
    // Try POST to /v1/policy/validate if it exists
    // Note: This would require makeRequest to be exported or a dedicated function
    // For now, we'll do local validation only
    // Local validation: parse and check structure
    try {
        const ext = path.extname(policyPath).toLowerCase();
        let data;
        if (ext === ".json") {
            data = JSON.parse(content);
        }
        else if (ext === ".yaml" || ext === ".yml") {
            try {
                const yaml = require("yaml");
                data = yaml.parse(content);
            }
            catch (e) {
                throw new types_1.FarameshError("YAML support requires 'yaml' package. Install with: npm install yaml");
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
                    throw new types_1.FarameshError("YAML support requires 'yaml' package. Install with: npm install yaml");
                }
            }
        }
        if (typeof data !== "object" || data === null) {
            throw new types_1.FarameshPolicyError("Policy must be a YAML/JSON object");
        }
        // Check for basic structure
        if (!Array.isArray(data.rules)) {
            throw new types_1.FarameshPolicyError("Policy must have 'rules' field as a list");
        }
        // Validate each rule has required fields
        const errors = [];
        for (let i = 0; i < data.rules.length; i++) {
            const rule = data.rules[i];
            if (typeof rule !== "object" || rule === null) {
                errors.push(`Rule ${i} must be an object`);
                continue;
            }
            if (!rule.match) {
                errors.push(`Rule ${i} missing 'match' field`);
            }
            if (!rule.allow && !rule.deny) {
                errors.push(`Rule ${i} must have 'allow' or 'deny' field`);
            }
        }
        if (errors.length > 0) {
            throw new types_1.FarameshPolicyError(`Policy validation errors: ${errors.join("; ")}`);
        }
    }
    catch (error) {
        if (error instanceof types_1.FarameshPolicyError) {
            throw error;
        }
        throw new types_1.FarameshPolicyError(`Failed to validate policy: ${error.message}`);
    }
}
/**
 * Test a policy against an action (if server endpoint exists)
 */
async function testPolicyAgainstAction(policyPath, action) {
    if (!fs.existsSync(policyPath)) {
        throw new types_1.FarameshError(`Policy file not found: ${policyPath}`);
    }
    let policyContent;
    try {
        policyContent = fs.readFileSync(policyPath, "utf-8");
    }
    catch (error) {
        throw new types_1.FarameshError(`Failed to read policy file: ${error.message}`);
    }
    // Try POST to /v1/policy/test if it exists
    // Note: This would require makeRequest to be exported or a dedicated function
    // For now, we'll throw an error indicating the endpoint is not available
    throw new types_1.FarameshError(`Policy testing endpoint not available. Server may not support /v1/policy/test. ` +
        `This feature requires server-side support.`);
}
