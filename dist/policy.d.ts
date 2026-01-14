/**
 * Typed policy objects for client-side policy building and validation.
 *
 * These models allow you to build and test policies in code without needing
 * to write YAML files. The server-side DSL, evaluators, and policy packs
 * remain in Horizon/Nexus.
 */
export type RiskLevel = "low" | "medium" | "high";
export interface MatchCondition {
    tool?: string;
    op?: string;
    operation?: string;
    pattern?: string;
    contains?: string;
    amount_gt?: number;
    amount_lt?: number;
    amount_gte?: number;
    amount_lte?: number;
    path_contains?: string;
    path_starts_with?: string;
    path_ends_with?: string;
    method?: string;
    branch?: string;
    agent_id?: string;
    field?: string;
    value?: any;
}
export interface PolicyRule {
    match: MatchCondition;
    description: string;
    allow?: boolean;
    deny?: boolean;
    require_approval?: boolean;
    risk?: RiskLevel;
}
export interface RiskRule {
    name: string;
    when: MatchCondition;
    risk_level: RiskLevel;
}
export interface Policy {
    rules: PolicyRule[];
    risk?: {
        rules: RiskRule[];
    };
}
/**
 * Validate a policy and return list of errors (empty if valid)
 */
export declare function validatePolicy(policy: Policy): string[];
/**
 * Convert policy to YAML string
 */
export declare function policyToYaml(policy: Policy): string;
/**
 * Convert policy to dictionary
 */
export declare function policyToDict(policy: Policy): any;
/**
 * Create a policy from rules
 */
export declare function createPolicy(rules: PolicyRule[], riskRules?: RiskRule[]): Policy;
