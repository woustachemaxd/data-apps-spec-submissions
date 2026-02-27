/**
 * Snowflake Cortex integration for natural language queries.
 * Uses the ASK_LLM stored procedure to call LLM and get responses.
 */

import { querySnowflake } from "./snowflake";

// Schema context for the LLM - helps it understand the data
const SCHEMA_CONTEXT = `
You are a data assistant for a snow cone shop operations dashboard. Answer questions about the data helpfully.

Database: SNOWCONE_DB | Schema: SNOWCONE

Tables:
1. LOCATIONS (LOCATION_ID, NAME, CITY, STATE, ADDRESS, MANAGER_NAME, OPEN_DATE, SEATING_CAPACITY, IS_ACTIVE)
   - 15 locations across Texas
   - Contains store details and manager info

2. DAILY_SALES (SALE_ID, LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS, AVG_ORDER_VALUE)
   - Daily sales data from Nov 2025 - Jan 2026
   - ORDER_TYPE values: 'dine-in', 'takeout', 'delivery'

3. CUSTOMER_REVIEWS (REVIEW_ID, LOCATION_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME)
   - Customer reviews per location
   - RATING scale: 1.0 to 5.0

4. INVENTORY (INVENTORY_ID, LOCATION_ID, RECORD_DATE, CATEGORY, UNITS_RECEIVED, UNITS_USED, UNITS_WASTED, WASTE_COST)
   - Weekly inventory records
   - CATEGORY values: 'dairy', 'produce', 'cones_cups', 'toppings', 'syrups'

When answering:
- Be concise and helpful
- If asked about specific numbers, mention you can provide insights based on the data patterns
- For location-specific questions, reference the location names
- Format numbers nicely (use $ for revenue, % for percentages)
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
  cost?: number;
  remaining_credits?: number;
  error?: string;
}

/**
 * Call the ASK_LLM stored procedure to get AI responses
 */
export async function askCortex(question: string): Promise<CortexResult> {
  try {
    // Build the full prompt with schema context
    const fullPrompt = `${SCHEMA_CONTEXT}\n\nUser question: ${question}`;
    
    // Call the ASK_LLM stored procedure
    // Signature: CALL ASK_LLM('email', 'prompt', 'model')
    const query = `CALL ASK_LLM('${USER_EMAIL}', '${fullPrompt.replace(/'/g, "''")}', '${LLM_MODEL}')`;
    
    const result = await querySnowflake<Record<string, unknown>>(query);
    
    console.log('ASK_LLM raw result:', JSON.stringify(result, null, 2));
    
    if (result && result.length > 0) {
      const row = result[0];
      
      // The stored procedure returns a VARIANT column. The column name could be:
      // - 'ASK_LLM' (procedure name)
      // - A generated name
      // Get the first value from the row that looks like our response
      const variantValue = Object.values(row)[0];
      
      if (!variantValue) {
        return { success: false, error: 'No data returned from LLM' };
      }
      
      // Parse the VARIANT value - it could be a JSON string or already an object
      let parsedResponse: AskLLMResponse;
      
      if (typeof variantValue === 'string') {
        try {
          parsedResponse = JSON.parse(variantValue);
        } catch {
          // If it's not valid JSON, treat it as a plain text response
          return {
            success: true,
            response: variantValue,
          };
        }
      } else if (typeof variantValue === 'object' && variantValue !== null) {
        parsedResponse = variantValue as AskLLMResponse;
      } else {
        return {
          success: true,
          response: String(variantValue),
        };
      }
      
      // Extract the response text - check various field names
      const responseText = parsedResponse.response 
        || parsedResponse.message 
        || parsedResponse.content
        || (typeof parsedResponse === 'string' ? parsedResponse : null);
      
      if (responseText) {
        return {
          success: true,
          response: responseText,
          cost: parsedResponse.cost,
          remaining_credits: parsedResponse.remaining_credits,
        };
      }
      
      // If we got here, we have a parsed response but no text field
      // Return the whole parsed response as JSON string
      return {
        success: true,
        response: JSON.stringify(parsedResponse, null, 2),
      };
    }
    
    return { success: false, error: 'No response from LLM' };
  } catch (error) {
    console.error('ASK_LLM error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get response from LLM' 
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