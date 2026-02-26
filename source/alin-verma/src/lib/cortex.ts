/**
 * Snowflake Cortex integration for natural language to SQL queries.
 * Uses Snowflake's CORTEX.COMPLETE function to generate SQL from user questions.
 */

import { querySnowflake } from "./snowflake";

// Minimal schema context for Cortex - optimized for token efficiency
const SCHEMA_CONTEXT = `
Database: SNOWCONE_DB | Schema: SNOWCONE

Tables:
1. LOCATIONS (LOCATION_ID, NAME, CITY, STATE, ADDRESS, MANAGER_NAME, OPEN_DATE, SEATING_CAPACITY, IS_ACTIVE)
2. DAILY_SALES (SALE_ID, LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS, AVG_ORDER_VALUE)
3. CUSTOMER_REVIEWS (REVIEW_ID, LOCATION_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME)
4. INVENTORY (INVENTORY_ID, LOCATION_ID, RECORD_DATE, CATEGORY, UNITS_RECEIVED, UNITS_USED, UNITS_WASTED, WASTE_COST)

Key relationships:
- DAILY_SALES.LOCATION_ID → LOCATIONS.LOCATION_ID
- CUSTOMER_REVIEWS.LOCATION_ID → LOCATIONS.LOCATION_ID
- INVENTORY.LOCATION_ID → LOCATIONS.LOCATION_ID
- ORDER_TYPE values: 'dine-in', 'takeout', 'delivery'
- INVENTORY.CATEGORY values: 'dairy', 'produce', 'cones_cups', 'toppings', 'syrups'
- RATING scale: 1.0 to 5.0
`;

// System prompt for Cortex - concise to minimize tokens
const SYSTEM_PROMPT = `You are a SQL expert for a snow cone shop dashboard. Convert questions to valid Snowflake SQL queries.

Rules:
- Return ONLY the SQL query, no explanations
- Use fully qualified table names: SNOWCONE_DB.SNOWCONE.TABLE_NAME
- Use proper Snowflake syntax
- For aggregations, use appropriate GROUP BY
- For dates, use DATE or TIMESTAMP functions as needed
- Limit results to 100 rows max (add LIMIT clause)
- Order by relevance (most recent or highest value first)

Schema context:
${SCHEMA_CONTEXT}`;

interface CortexResponse {
  sql: string;
  error?: string;
}

/**
 * Call Snowflake Cortex Complete to generate SQL from natural language
 */
export async function generateSQLFromQuestion(question: string): Promise<CortexResponse> {
  try {
    // Use Cortex Complete via SQL - this calls Snowflake's hosted LLM
    // Using 'any_region.snowflake-arctic' for cross-region inference
    const cortexQuery = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'any_region.snowflake-arctic',
        CONCAT(
          '${SYSTEM_PROMPT.replace(/'/g, "''")}',
          '\\n\\nUser question: ',
          '${question.replace(/'/g, "''")}',
          '\\n\\nSQL query:'
        )
      ) AS generated_sql
    `;

    const result = await querySnowflake<{ GENERATED_SQL: string }>(cortexQuery);
    
    if (result && result.length > 0 && result[0].GENERATED_SQL) {
      let sql = result[0].GENERATED_SQL.trim();
      
      // Clean up the response - remove markdown code blocks if present
      sql = sql.replace(/^```sql\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      sql = sql.trim();
      
      return { sql };
    }
    
    return { sql: '', error: 'No SQL generated' };
  } catch (error) {
    console.error('Cortex error:', error);
    return { 
      sql: '', 
      error: error instanceof Error ? error.message : 'Failed to generate SQL' 
    };
  }
}

/**
 * Execute a natural language question and return results
 */
export async function askCortex(question: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>[];
  sql?: string;
  error?: string;
}> {
  // Step 1: Generate SQL from question
  const { sql, error } = await generateSQLFromQuestion(question);
  
  if (error || !sql) {
    return { success: false, error: error || 'Failed to generate SQL' };
  }
  
  // Step 2: Execute the generated SQL
  try {
    const data = await querySnowflake(sql);
    return { success: true, data, sql };
  } catch (execError) {
    console.error('SQL execution error:', execError);
    return { 
      success: false, 
      sql, 
      error: execError instanceof Error ? execError.message : 'Failed to execute query' 
    };
  }
}

/**
 * Format query results for display in chat
 */
export function formatResultsForChat(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return 'No results found.';
  }
  
  const columns = Object.keys(data[0]);
  const maxRows = 10; // Limit display rows
  const displayData = data.slice(0, maxRows);
  
  // Calculate column widths
  const widths: Record<string, number> = {};
  columns.forEach(col => {
    widths[col] = Math.max(
      col.length,
      ...displayData.map(row => String(row[col] ?? '').length)
    );
  });
  
  // Build table
  const header = columns.map(col => col.padEnd(widths[col])).join(' | ');
  const separator = columns.map(col => '-'.repeat(widths[col])).join('-+-');
  const rows = displayData.map(row => 
    columns.map(col => String(row[col] ?? '').padEnd(widths[col])).join(' | ')
  );
  
  let result = `${header}\n${separator}\n${rows.join('\n')}`;
  
  if (data.length > maxRows) {
    result += `\n\n... and ${data.length - maxRows} more rows.`;
  }
  
  return result;
}