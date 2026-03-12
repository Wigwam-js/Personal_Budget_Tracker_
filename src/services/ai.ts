import { GoogleGenAI, Type } from '@google/genai';
import { Transaction, CategoryCorrection, TransactionType, Account, Due } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function categorizeTransaction(
  merchant: string,
  amount: number,
  notes: string = '',
  corrections: CategoryCorrection[] = []
): Promise<{ category: string; type: TransactionType; reasoning: string }> {
  try {
    const prompt = `
      You are an intelligent financial assistant. Categorize the following transaction.
      
      Transaction Details:
      - Merchant/Description: ${merchant}
      - Amount: ₹${amount}
      - Notes: ${notes}
      
      Important Rules:
      1. Determine if this is an 'expense', 'income', 'transfer', or 'pass-through'.
      2. A 'pass-through' is money received that is meant to be sent to someone else (e.g., rent from a roommate, splitting a dinner bill). If the notes or merchant imply this, mark it as 'pass-through'.
      3. If it's a credit card payment or moving money between owned accounts, it's a 'transfer'.
      4. Assign a standard budgeting category (e.g., Groceries, Dining Out, Utilities, Rent, Entertainment, Shopping, Income, Transfer, Pass-Through).
      
      User's Past Corrections (Learn from these if applicable):
      ${corrections.map(c => `- ${c.merchant} -> ${c.correctedCategory} (${c.correctedType})`).join('\n')}
      
      Analyze the transaction and provide the category, type, and a brief reasoning.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'The assigned category' },
            type: { type: Type.STRING, description: 'One of: expense, income, transfer, pass-through' },
            reasoning: { type: Type.STRING, description: 'Brief explanation of why this category and type were chosen' },
          },
          required: ['category', 'type', 'reasoning'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Validate type
    const validTypes: TransactionType[] = ['expense', 'income', 'transfer', 'pass-through'];
    const type = validTypes.includes(result.type) ? result.type as TransactionType : 'expense';

    return {
      category: result.category || 'Uncategorized',
      type,
      reasoning: result.reasoning || 'Categorized automatically.',
    };
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return { category: 'Uncategorized', type: 'expense', reasoning: 'Failed to categorize due to an error.' };
  }
}

export async function analyzeSpendingSpikes(transactions: Transaction[]): Promise<string[]> {
  if (transactions.length === 0) return [];
  
  try {
    // Only send recent expenses for analysis to save tokens and focus on spikes
    const recentExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Last 50 expenses

    const prompt = `
      You are an AI financial analyst. Review the user's recent expenses and identify any unusual spending spikes, deviations from typical patterns, or notable trends for the current week/month.
      
      Recent Expenses (JSON):
      ${JSON.stringify(recentExpenses.map(t => ({ date: t.date, amount: t.amount, category: t.category, merchant: t.merchant })))}
      
      Provide 2-3 short, actionable, and insightful bullet points highlighting anomalies or trends. Keep it concise and user-friendly. Do not use markdown formatting like asterisks or bolding, just plain text sentences. Use ₹ for currency.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of insight strings',
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error('Error analyzing spending spikes:', error);
    return ['Unable to analyze spending patterns at this time.'];
  }
}

export async function parseChatInput(message: string, accounts: Account[]): Promise<{
  action: 'add_transaction' | 'add_due' | 'general_response';
  transaction?: Partial<Transaction>;
  due?: Partial<Due>;
  responseMessage: string;
}> {
  try {
    const prompt = `
      You are an intelligent financial assistant. The user says: "${message}"
      
      Available Accounts:
      ${accounts.map(a => `- ${a.name} (ID: ${a.id})`).join('\n')}
      
      Determine the user's intent:
      1. Are they trying to log a transaction (expense, income, transfer, pass-through)?
      2. Are they trying to add an upcoming EMI or Bill (Due)?
      3. Or are they just asking a general question?
      
      If logging a transaction, extract: amount, merchant/description, notes (if any), and guess the best accountId (default to the first one if unsure).
      If adding a due/EMI, extract: title, amount, dueDate (ISO string), type ('emi' or 'bill'), and accountId.
      
      Provide a friendly responseMessage acknowledging the action or answering the question.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: 'One of: add_transaction, add_due, general_response' },
            responseMessage: { type: Type.STRING, description: 'Friendly response to the user' },
            transaction: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                merchant: { type: Type.STRING },
                notes: { type: Type.STRING },
                accountId: { type: Type.STRING }
              }
            },
            due: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                dueDate: { type: Type.STRING },
                type: { type: Type.STRING },
                accountId: { type: Type.STRING }
              }
            }
          },
          required: ['action', 'responseMessage'],
        },
      },
    });

    let rawText = response.text || '{}';
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    const result = JSON.parse(rawText);
    return result;
  } catch (error) {
    console.error('Error parsing chat:', error);
    return {
      action: 'general_response',
      responseMessage: 'Sorry, I had trouble understanding that. Could you try rephrasing?'
    };
  }
}
