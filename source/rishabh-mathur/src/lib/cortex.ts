import { querySnowflake } from "@/lib/snowflake";

export type CortexResult = {
  cost: number;
  input_tokens: number;
  output_tokens: number;
  remaining_credits: number;
  model: string;
  response: string;
};

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function askLlm(prompt: string, userEmail: string, model?: string): Promise<CortexResult> {
  const safeEmail = escapeSqlString(userEmail.trim());
  const safePrompt = escapeSqlString(prompt);
  const safeModel = model?.trim() ? escapeSqlString(model.trim()) : "";

  const sql = safeModel
    ? `CALL ASK_LLM('${safeEmail}', '${safePrompt}', '${safeModel}')`
    : `CALL ASK_LLM('${safeEmail}', '${safePrompt}')`;

  const rows = await querySnowflake<Record<string, unknown>>(sql);
  if (!rows.length) {
    throw new Error("Cortex call returned no rows.");
  }

  const rawValue = Object.values(rows[0])[0];
  const parsed = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
  const payload = (parsed ?? {}) as Record<string, unknown>;

  return {
    cost: toNum(payload.cost),
    input_tokens: toNum(payload.input_tokens),
    output_tokens: toNum(payload.output_tokens),
    remaining_credits: toNum(payload.remaining_credits),
    model: String(payload.model ?? (safeModel || "unknown")),
    response: String(payload.response ?? ""),
  };
}
