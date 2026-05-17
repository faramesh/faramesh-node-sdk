/** Structured denial exception for governed tool calls. */

export interface DenialResolution {
  type?: string;
  retry_after_seconds?: number;
  resets_at?: string;
  approval_id?: string;
  approval_ids?: string[];
  poll_url?: string;
}

export interface StructuredDenial {
  code?: string;
  rule_id?: string;
  rule_ref?: string;
  human_message?: string;
  resolution?: DenialResolution;
}

export class ToolDeniedException extends Error {
  readonly code: string;
  readonly ruleId: string;
  readonly ruleRef: string;
  readonly humanMessage: string;
  readonly resolution: DenialResolution;
  readonly effect: string;
  readonly deferToken: string;
  readonly approvalId: string;

  constructor(
    message = "",
    opts: {
      code?: string;
      ruleId?: string;
      ruleRef?: string;
      humanMessage?: string;
      resolution?: DenialResolution;
      structuredDenial?: StructuredDenial;
      effect?: string;
      deferToken?: string;
    } = {}
  ) {
    const payload = opts.structuredDenial ?? {};
    const code = opts.code ?? payload.code ?? "";
    const human =
      opts.humanMessage ?? payload.human_message ?? message ?? code ?? "tool call denied";
    super(human);
    this.name = "ToolDeniedException";
    this.code = code;
    this.ruleId = opts.ruleId ?? payload.rule_id ?? "";
    this.ruleRef = opts.ruleRef ?? payload.rule_ref ?? "";
    this.humanMessage = human;
    this.resolution = opts.resolution ?? payload.resolution ?? {};
    this.effect = opts.effect ?? "";
    this.deferToken = opts.deferToken ?? "";
    this.approvalId = String(this.resolution.approval_id ?? "");
  }

  static fromGovernResult(result: {
    effect?: string;
    reason_code?: string;
    defer_token?: string;
    structured_denial?: StructuredDenial;
  }): ToolDeniedException {
    const denial = result.structured_denial ?? {};
    return new ToolDeniedException(
      denial.human_message ?? result.reason_code ?? "tool call denied",
      {
        code: denial.code ?? result.reason_code,
        ruleId: denial.rule_id,
        ruleRef: denial.rule_ref,
        humanMessage: denial.human_message,
        resolution: denial.resolution,
        structuredDenial: denial,
        effect: result.effect,
        deferToken: result.defer_token,
      }
    );
  }
}
