"use strict";
/**
 * Typed policy objects for client-side policy building and validation.
 *
 * These models allow you to build and test policies in code without needing
 * to write YAML files. The server-side DSL, evaluators, and policy packs
 * remain in Horizon/Nexus.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePolicy = validatePolicy;
exports.policyToYaml = policyToYaml;
exports.policyToDict = policyToDict;
exports.createPolicy = createPolicy;
/**
 * Validate a policy and return list of errors (empty if valid)
 */
function validatePolicy(policy) {
    const errors = [];
    if (!policy.rules || policy.rules.length === 0) {
        errors.push("Policy must have at least one rule");
    }
    policy.rules.forEach((rule, index) => {
        if (!rule.description) {
            errors.push(`Rule ${index + 1}: description is required`);
        }
        const matchKeys = Object.keys(rule.match || {});
        if (matchKeys.length === 0) {
            errors.push(`Rule ${index + 1}: match conditions cannot be empty`);
        }
        const effects = [
            rule.allow === true,
            rule.deny === true,
            rule.require_approval === true,
        ].filter(Boolean).length;
        if (effects !== 1) {
            errors.push(`Rule ${index + 1}: must have exactly one effect (allow, deny, or require_approval)`);
        }
    });
    return errors;
}
/**
 * Convert policy to YAML string
 */
function policyToYaml(policy) {
    try {
        const yaml = require("yaml");
        return yaml.stringify(policyToDict(policy), { defaultStringType: "PLAIN" });
    }
    catch {
        throw new Error("YAML support requires 'yaml' package. Install with: npm install yaml");
    }
}
/**
 * Convert policy to dictionary
 */
function policyToDict(policy) {
    const result = {
        rules: policy.rules.map((rule) => {
            const ruleDict = {
                match: { ...rule.match },
                description: rule.description,
            };
            if (rule.allow !== undefined)
                ruleDict.allow = rule.allow;
            if (rule.deny !== undefined)
                ruleDict.deny = rule.deny;
            if (rule.require_approval !== undefined)
                ruleDict.require_approval = rule.require_approval;
            if (rule.risk)
                ruleDict.risk = rule.risk;
            return ruleDict;
        }),
    };
    if (policy.risk && policy.risk.rules) {
        result.risk = {
            rules: policy.risk.rules.map((rule) => ({
                name: rule.name,
                when: rule.when,
                risk_level: rule.risk_level,
            })),
        };
    }
    return result;
}
/**
 * Create a policy from rules
 */
function createPolicy(rules, riskRules) {
    return {
        rules,
        risk: riskRules ? { rules: riskRules } : undefined,
    };
}
