import dotenv from "dotenv";
dotenv.config();

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const SYSTEM_PROMPT = `You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract the amount as a number (no currency symbols)
2. Default currency is INR unless explicitly mentioned (USD, EUR, etc.)
3. Categorize into EXACTLY one of these categories:
   - Food & Dining (restaurants, cafes, food delivery, groceries)
   - Transport (uber, ola, taxi, fuel, parking, metro)
   - Shopping (clothes, electronics, amazon, flipkart)
   - Entertainment (movies, netflix, spotify, games)
   - Bills & Utilities (electricity, water, internet, phone)
   - Health (medicine, doctor, gym, pharmacy)
   - Travel (flights, hotels, trips)
   - Other (anything that doesn't fit above)
4. Description should be a clean summary (not the raw input)
5. Merchant is the company/store name if mentioned, null otherwise
6. If you can recognize a category or merchant but NO amount is present,
   still return the error below — do NOT guess or assume an amount.

RESPOND ONLY WITH VALID JSON, no other text:
{
  "amount": <number>,
  "currency": "<string>",
  "category": "<string>",
  "description": "<string>",
  "merchant": "<string or null>"
}

If no amount is found (even if category/merchant is clear), respond:
{
  "error": "No amount found. Please include an amount like '200 on coffee'.",
  "amount": null
}

If the input is completely unparseable, respond:
{
  "error": "Could not understand input. Try something like 'spent 500 on lunch'.",
  "amount": null
}`;

export async function parseExpense(text: string): Promise<ParsedExpense> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set in environment");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const raw =
    (data as ChatCompletionResponse).choices?.[0]?.message?.content ?? "";

  let parsed: any;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error("AI returned invalid JSON");
  }


  if (parsed.error || parsed.amount === null || parsed.amount === undefined) {
    throw new Error(
      parsed.error ?? "Could not parse expense. Please include an amount.",
    );
  }

  return {
    amount: Number(parsed.amount),
    currency: parsed.currency ?? "INR",
    category: parsed.category ?? "Other",
    description: parsed.description ?? text,
    merchant: parsed.merchant ?? null,
  };
}
