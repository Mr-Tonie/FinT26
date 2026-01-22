/**
 * API service for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Get stored auth token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Save auth token
 */
function saveAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove auth token
 */
function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Make API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network error' };
  }
}

/**
 * Auth API
 */
export const authAPI = {
  async register(email: string, password: string, name: string) {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: { id: number; email: string; name: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.data?.token) {
      saveAuthToken(response.data.token);
    }

    return response;
  },

  async login(email: string, password: string) {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: { id: number; email: string; name: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      saveAuthToken(response.data.token);
    }

    return response;
  },

  async getCurrentUser() {
    return apiRequest<{
      user: { id: number; email: string; name: string; created_at: string };
    }>('/auth/me');
  },

  logout() {
    removeAuthToken();
  },
};

/**
 * Transactions API
 */
export const transactionsAPI = {
  async getAll() {
    return apiRequest<{
      transactions: Array<{
        id: number;
        user_id: number;
        date: string;
        description: string;
        amount: number;
        currency: string;
        category: string;
        payment_method: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
    }>('/transactions');
  },

  async create(transaction: {
    date: string;
    description: string;
    amount: number;
    currency: string;
    category: string;
    payment_method: string;
    notes?: string;
  }) {
    return apiRequest<{
      message: string;
      transaction: any;
    }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async delete(id: number) {
    return apiRequest<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async getStatistics() {
    return apiRequest<{
      statistics: {
        totalIncome: number;
        totalExpenses: number;
        netCashflow: number;
        transactionCount: number;
      };
    }>('/transactions/statistics');
  },
};

/**
 * Savings API
 */
export const savingsAPI = {
  async getAll() {
    return apiRequest<{
      savingsGoals: Array<{
        id: number;
        user_id: number;
        name: string;
        target_amount: number;
        current_amount: number;
        currency: string;
        deadline: string | null;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>;
    }>('/savings');
  },

  async create(goal: {
    name: string;
    target_amount: number;
    current_amount?: number;
    currency: string;
    deadline?: string;
    description?: string;
  }) {
    return apiRequest<{
      message: string;
      savingsGoal: any;
    }>('/savings', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  async update(id: number, current_amount: number) {
    return apiRequest<{ message: string }>(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ current_amount }),
    });
  },

  async delete(id: number) {
    return apiRequest<{ message: string }>(`/savings/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Investments API
 */
export const investmentsAPI = {
  async getAll() {
    return apiRequest<{
      investments: Array<{
        id: number;
        user_id: number;
        name: string;
        asset_type: string;
        risk_level: string;
        principal_amount: number;
        current_value: number;
        currency: string;
        purchase_date: string;
        provider: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
    }>('/investments');
  },

  async create(investment: {
    name: string;
    asset_type: string;
    risk_level: string;
    principal_amount: number;
    current_value: number;
    currency: string;
    purchase_date: string;
    provider?: string;
    notes?: string;
  }) {
    return apiRequest<{
      message: string;
      investment: any;
    }>('/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  },

  async update(id: number, current_value: number) {
    return apiRequest<{ message: string }>(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ current_value }),
    });
  },

  async delete(id: number) {
    return apiRequest<{ message: string }>(`/investments/${id}`, {
      method: 'DELETE',
    });
  },

  async getStatistics() {
    return apiRequest<{
      statistics: {
        totalInvested: number;
        totalValue: number;
        totalGainLoss: number;
        investmentCount: number;
      };
    }>('/investments/statistics');
  },
};

export { getAuthToken, saveAuthToken, removeAuthToken };

