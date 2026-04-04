import { GoogleGenAI, Type } from '@google/genai';
import { DonationResult, Transaction } from '../lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeTransactions(
  transactions: Transaction[],
  year: string,
): Promise<DonationResult[]> {
  if (transactions.length === 0) return [];

  // Filter transactions for the selected year first to save tokens
  const filtered = transactions.filter((t) => t.date.includes(year));

  if (filtered.length === 0) return [];

  // Chunk transactions if there are too many (Gemini can handle a lot, but let's be safe)
  const transactionList = filtered
    .map(
      (t) =>
        `Date: ${t.date}, Amount: ${t.amount}, Desc: ${t.description}, To: ${t.counterparty || 'Unknown'}`,
    )
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identify all donations to ANBI (Public Benefit Organizations) in the following list of transactions for the year ${year}.
    ANBIs are typically charities, religious institutions, or cultural organizations.

    Transactions:
    ${transactionList}

    Return only the donations found.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            organization: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            isAnbi: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
          },
          required: ['organization', 'amount', 'date', 'isAnbi'],
        },
      },
    },
  });

  try {
    const results = JSON.parse(response.text || '[]');
    return results.filter((r: DonationResult) => r.isAnbi);
  } catch (e) {
    console.error('Failed to parse Gemini response', e);
    return [];
  }
}
