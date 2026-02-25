/**
 * Query Snowflake directly from the browser.
 *
 * Uses Snowflake's SQL REST API with JWT key-pair authentication.
 * Connection config is read from VITE_SNOWFLAKE_* env vars.
 * The private key is loaded from rsa_key.p8 in the project root.
 *
 * Usage:
 *   import { querySnowflake } from "@/lib/snowflake";
 *
 *   const locations = await querySnowflake("SELECT * FROM LOCATIONS");
 *   const sales = await querySnowflake(`
 *     SELECT l.NAME, SUM(s.REVENUE) AS TOTAL_REVENUE
 *     FROM DAILY_SALES s
 *     JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
 *     GROUP BY l.NAME
 *   `);
 */

import { importPKCS8, SignJWT } from "jose";
import PRIVATE_KEY_PEM from "../../rsa_key.p8?raw";

const ACCOUNT = import.meta.env.VITE_SNOWFLAKE_ACCOUNT;
const USER = import.meta.env.VITE_SNOWFLAKE_USER;
const DATABASE = import.meta.env.VITE_SNOWFLAKE_DATABASE;
const SCHEMA = import.meta.env.VITE_SNOWFLAKE_SCHEMA;
const WAREHOUSE = import.meta.env.VITE_SNOWFLAKE_WAREHOUSE;
const PUBLIC_KEY_FP = import.meta.env.VITE_SNOWFLAKE_PUBLIC_KEY_FP;

const BASE_URL = `https://${ACCOUNT}.snowflakecomputing.com`;

let jwtToken: string | null = null;
let jwtExpiry: number = 0;

/**
 * Generate a JWT token for Snowflake key-pair authentication
 */
async function generateJWT(): Promise<string> {
  const privateKey = await importPKCS8(PRIVATE_KEY_PEM, "RS256");

  // Build claims per Snowflake docs — all UPPERCASE
  const accountUpper = ACCOUNT!.toUpperCase();
  const userUpper = USER!.toUpperCase();

  const issuer = `${accountUpper}.${userUpper}.${PUBLIC_KEY_FP}`;
  const subject = `${accountUpper}.${userUpper}`;

  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(issuer)
    .setSubject(subject)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  return token;
}

/**
 * Get a valid JWT token, generating a new one if needed
 */
async function getJWT(): Promise<string> {
  if (!jwtToken || Date.now() / 1000 > jwtExpiry - 30) {
    jwtToken = await generateJWT();
    jwtExpiry = Math.floor(Date.now() / 1000) + 3600;
  }
  return jwtToken;
}

/**
 * Execute a SQL query against Snowflake and return the rows.
 */
export async function querySnowflake<T = Record<string, unknown>>(
  sql: string
): Promise<T[]> {
  const token = await getJWT();

  const res = await fetch(`${BASE_URL}/api/v2/statements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
    },
    body: JSON.stringify({
      statement: sql,
      database: DATABASE,
      schema: SCHEMA,
      warehouse: WAREHOUSE,
      timeout: 30,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Query failed (${res.status})`);
  }

  const json = await res.json();

  // The SQL API returns data in a columnar format — convert to row objects
  const columns: string[] =
    json.resultSetMetaData?.rowType?.map(
      (col: { name: string }) => col.name
    ) ?? [];
  const rows: string[][] = json.data ?? [];

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  }) as T[];
}
