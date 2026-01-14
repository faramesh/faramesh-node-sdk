/**
 * Policy validation and testing helpers
 */
/**
 * Validate a policy YAML/JSON file
 */
export declare function validatePolicyFile(policyPath: string): Promise<void>;
/**
 * Test a policy against an action (if server endpoint exists)
 */
export declare function testPolicyAgainstAction(policyPath: string, action: any): Promise<any>;
