/**
 * Snowflake Cortex integration for natural language queries.
 * Uses the ASK_LLM stored procedure to generate SQL queries from natural language.
 * Then executes the SQL query and returns the actual data.
 */

import { querySnowflake } from "./snowflake";

// Schema context for the LLM - helps it understand the data structure
const SCHEMA_CONTEXT = `
You are a SQL query generator for a snow cone shop operations dashboard.
Your ONLY job is to generate valid SQL queries. DO NOT provide explanations or commentary.

Database: SNOWCONE_DB | Schema: SNOWCONE

Tables:
1. LOCATIONS (LOCATION_ID NUMBER, NAME VARCHAR, CITY VARCHAR, STATE VARCHAR, ADDRESS VARCHAR, MANAGER_NAME VARCHAR, OPEN_DATE DATE, SEATING_CAPACITY NUMBER, IS_ACTIVE BOOLEAN)
   - 15 locations across Texas
   - Contains store details and manager info

2. DAILY_SALES (SALE_ID NUMBER, LOCATION_ID NUMBER, SALE_DATE DATE, ORDER_TYPE VARCHAR, REVENUE NUMBER, NUM_ORDERS NUMBER, AVG_ORDER_VALUE NUMBER)
   - Daily sales data from Nov 2025 - Jan 2026
   - ORDER_TYPE values: 'dine-in', 'takeout', 'delivery'

3. CUSTOMER_REVIEWS (REVIEW_ID NUMBER, LOCATION_ID NUMBER, REVIEW_DATE DATE, RATING NUMBER, REVIEW_TEXT VARCHAR, CUSTOMER_NAME VARCHAR)
   - Customer reviews per location
   - RATING scale: 1.0 to 5.0

4. INVENTORY (INVENTORY_ID NUMBER, LOCATION_ID NUMBER, RECORD_DATE DATE, CATEGORY VARCHAR, UNITS_RECEIVED NUMBER, UNITS_USED NUMBER, UNITS_WASTED NUMBER, WASTE_COST NUMBER)
   - Weekly inventory records
   - CATEGORY values: 'dairy', 'produce', 'cones_cups', 'toppings', 'syrups'

RULES:
1. Return ONLY a valid SQL SELECT query - no explanations, no markdown, no comments
2. Use proper table and column names exactly as shown above
3. Use SNOWCONE_DB.SNOWCONE prefix for tables if needed
4. For revenue, use REVENUE column from DAILY_SALES
5. For ratings, use RATING column from CUSTOMER_REVIEWS
6. For waste, use UNITS_WASTED or WASTE_COST from INVENTORY
7. Join with LOCATIONS table to get location names
8. Use appropriate aggregations (SUM, AVG, COUNT) when asking for totals/averages
9. Limit results to reasonable amounts (e.g., LIMIT 10 for top N queries)
10. Order results appropriately (DESC for top/highest, ASC for bottom/lowest)
`;

// User email for ASK_LLM procedure - required for tracking credits
// This should be set in .env as VITE_USER_EMAIL
const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'user@example.com';

// Model to use - can be configured via env
// Options: 'llama3.1-70b' (default), 'llama3.1-8b', 'deepseek-r1', etc.
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'llama3.1-70b';

interface AskLLMResponse {
  cost?: number;
  input_tokens?: number;
  model?: string;
  output_tokens?: number;
  remaining_credits?: number;
  response?: string;
  message?: string;  // Some models return 'message' instead of 'response'
  content?: string;  // Some models return 'content'
}

interface CortexResult {
  success: boolean;
  response?: string;
  sql?: string;
  data?: Record<string, unknown>[];
  cost?: number;
  remaining_credits?: number;
  error?: string;
}

/**
 * Extract SQL query from LLM response
 * Handles various formats the LLM might return
 */
function extractSQL(text: string): string | null {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```sql ... ``` or ``` ... ``` blocks
  const codeBlockMatch = cleaned.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  
  // If it starts with SELECT, it's likely a SQL query
  if (cleaned.toUpperCase().startsWith('SELECT')) {
    return cleaned;
  }
  
  // Try to find a SELECT statement anywhere in the text
  const selectMatch = cleaned.match(/(SELECT[\s\S]+)/i);
  if (selectMatch) {
    return selectMatch[1].trim();
  }
  
  return null;
}

/**
 * Generate SQL query from natural language question using LLM
 * Exported for use in Chatbot to show SQL while executing
 */
export async function generateSQL(question: string): Promise<{ sql: string | null; error?: string }> {
  try {
    // Build the prompt for SQL generation
    const fullPrompt = `${SCHEMA_CONTEXT}\n\nUser question: ${question}\n\nGenerate a SQL query to answer this question. Return ONLY the SQL query, nothing else.`;
    
    // Call the ASK_LLM stored procedure
    const query = `CALL ASK_LLM('${USER_EMAIL}', '${fullPrompt.replace(/'/g, "''")}', '${LLM_MODEL}')`;
    
    const result = await querySnowflake<Record<string, unknown>>(query);
    
    console.log('ASK_LLM SQL generation result:', JSON.stringify(result, null, 2));
    
    if (result && result.length > 0) {
      const row = result[0];
      const variantValue = Object.values(row)[0];
      
      if (!variantValue) {
        return { sql: null, error: 'No response from LLM' };
      }
      
      // Parse the response
      let responseText: string;
      
      if (typeof variantValue === 'string') {
        try {
          const parsed = JSON.parse(variantValue);
          responseText = parsed.response || parsed.message || parsed.content || variantValue;
        } catch {
          responseText = variantValue;
        }
      } else if (typeof variantValue === 'object' && variantValue !== null) {
        const parsed = variantValue as AskLLMResponse;
        responseText = parsed.response || parsed.message || parsed.content || JSON.stringify(variantValue);
      } else {
        responseText = String(variantValue);
      }
      
      // Extract SQL from the response
      const sql = extractSQL(responseText);
      
      if (sql) {
        return { sql };
      }
      
      return { sql: null, error: 'Could not extract SQL query from LLM response' };
    }
    
    return { sql: null, error: 'No response from LLM' };
  } catch (error) {
    console.error('SQL generation error:', error);
    return { 
      sql: null, 
      error: error instanceof Error ? error.message : 'Failed to generate SQL' 
    };
  }
}

/**
 * Ask Cortex: Generate SQL from natural language, execute it, and return results
 */
export async function askCortex(question: string): Promise<CortexResult> {
  try {
    // Step 1: Generate SQL query from the question
    const { sql, error } = await generateSQL(question);
    
    if (!sql) {
      return { 
        success: false, 
        error: error || 'Failed to generate SQL query' 
      };
    }
    
    console.log('Generated SQL:', sql);
    
    // Step 2: Execute the SQL query
    const data = await querySnowflake<Record<string, unknown>>(sql);
    
    // Step 3: Format and return the results
    return {
      success: true,
      sql: sql,
      data: data,
      response: formatResultsForChat(data),
    };
  } catch (error) {
    console.error('askCortex error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process your question' 
    };
  }
}

/**
 * Check remaining Cortex credits
 */
export async function checkCortexBalance(): Promise<{
  remaining_credits: number;
  total_spent: number;
  total_calls: number;
} | null> {
  try {
    const query = `SELECT * FROM SNOWCONE_DB.SNOWCONE.CORTEX_BALANCE`;
    const result = await querySnowflake<{
      USER_EMAIL: string;
      REMAINING_CREDITS: number;
      TOTAL_SPENT: number;
      TOTAL_CALLS: number;
    }>(query);
    
    if (result && result.length > 0) {
      return {
        remaining_credits: result[0].REMAINING_CREDITS,
        total_spent: result[0].TOTAL_SPENT,
        total_calls: result[0].TOTAL_CALLS,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to check Cortex balance:', error);
    return null;
  }
}

/**
 * Format the response for display in chat
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