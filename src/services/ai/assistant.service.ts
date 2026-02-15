const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface FinancialContext {
  transactions: any[];
  budgets: any[];
  savingsGoals: any[];
  investments: any[];
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
}

async function callOpenRouter(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FinT26 AI Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

export const aiAssistant = {
  async analyzeFinances(context: FinancialContext): Promise<string> {
    const prompt = `You are a professional financial advisor. Analyze this user's financial data and provide insights:

Total Income: $${context.totalIncome}
Total Expenses: $${context.totalExpenses}
Net Cashflow: $${context.netCashflow}
Number of Transactions: ${context.transactions.length}
Active Budgets: ${context.budgets.length}
Savings Goals: ${context.savingsGoals.length}
Investments: ${context.investments.length}

Recent Transactions (last 5):
${context.transactions.slice(0, 5).map(t => `- ${t.description}: $${t.amount} (${t.category})`).join('\n')}

Provide:
1. Financial Health Score (0-100)
2. Top 3 Insights
3. Top 3 Recommendations
4. One warning if spending is concerning

Keep it concise and actionable.`;

    return await callOpenRouter(prompt);
  },

  async getCategorySuggestion(description: string, amount: number): Promise<string> {
    const prompt = `Based on this transaction, suggest the most appropriate category:

Description: "${description}"
Amount: $${amount}

Categories available:
- income_salary
- income_business
- income_investment
- income_other
- expense_food
- expense_transport
- expense_housing
- expense_utilities
- expense_healthcare
- expense_education
- expense_entertainment
- expense_other

Respond with ONLY the category name, nothing else.`;

    return await callOpenRouter(prompt);
  },

  async getBudgetRecommendation(
    category: string,
    currentSpending: number,
    income: number
  ): Promise<number> {
    const prompt = `Recommend a monthly budget limit for this category:

Category: ${category}
Current Monthly Spending: $${currentSpending}
Monthly Income: $${income}

Respond with ONLY a number (the recommended budget amount), nothing else.`;

    const response = await callOpenRouter(prompt);
    const amount = parseFloat(response.trim());
    return isNaN(amount) ? currentSpending : amount;
  },

  async answerQuestion(question: string, context: FinancialContext): Promise<string> {
    const prompt = `You are a helpful financial assistant. Answer this question based on the user's financial data:

User's Financial Summary:
- Total Income: $${context.totalIncome}
- Total Expenses: $${context.totalExpenses}
- Net Cashflow: $${context.netCashflow}
- Transactions: ${context.transactions.length}
- Budgets: ${context.budgets.length}
- Savings Goals: ${context.savingsGoals.length}

Recent Transactions:
${context.transactions.slice(0, 10).map(t => `- ${t.description}: $${t.amount} (${t.category})`).join('\n')}

Question: ${question}

Provide a helpful, concise answer.`;

    return await callOpenRouter(prompt);
  },

  async predictSavingsGoal(
    goalAmount: number,
    currentAmount: number,
    monthlyIncome: number,
    monthlyExpenses: number
  ): Promise<string> {
    const prompt = `Analyze this savings goal:

Goal Amount: $${goalAmount}
Current Saved: $${currentAmount}
Monthly Income: $${monthlyIncome}
Monthly Expenses: $${monthlyExpenses}

Provide:
1. Estimated months to reach goal
2. Recommended monthly savings amount
3. One tip to reach it faster

Keep it brief.`;

    return await callOpenRouter(prompt);
  },
};