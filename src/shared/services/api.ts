const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5001/api";

/* ======================================================
   Token management
   ====================================================== */

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const saveAuthToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

/* ======================================================
   Generic API request
   ====================================================== */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiRequest(endpoint, options);
        }
      }

      return { error: data?.error || "Request failed" };
    }

    return { data };
  } catch (error) {
    console.error("API request error:", error);
    return { error: "Network error" };
  }
}

/* ======================================================
   Token refresh
   ====================================================== */

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      removeAuthToken();
      return false;
    }

    const data = await response.json();

    if (data.accessToken) {
      saveAuthToken(data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Token refresh error:", error);
    removeAuthToken();
    return false;
  }
}

/* ======================================================
   Authentication API
   ====================================================== */

export const authAPI = {
  register(email: string, password: string, name: string) {
    return apiRequest<{
      message: string;
      user: { id: number; email: string; name: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },

  login(email: string, password: string) {
    return apiRequest<{
      message: string;
      user: { id: number; email: string; name: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser() {
    return apiRequest<{
      user: { id: number; email: string; name: string };
    }>("/auth/me");
  },

  async logout() {
    const refreshToken = getRefreshToken();

    const result = await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    removeAuthToken();
    return result;
  },
};

/* ======================================================
   Transactions API
   ====================================================== */

export const transactionsAPI = {
  getAll() {
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
    }>("/transactions");
  },

  create(transaction: {
    date: string;
    description: string;
    amount: number;
    currency: string;
    category: string;
    payment_method: string;
    notes?: string;
  }) {
    return apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
  },

  delete(id: number) {
    return apiRequest(`/transactions/${id}`, {
      method: "DELETE",
    });
  },

  getStatistics() {
    return apiRequest<{
      statistics: {
        totalIncome: number;
        totalExpenses: number;
        netCashflow: number;
        transactionCount: number;
      };
    }>("/transactions/statistics");
  },
};

/* ======================================================
   Savings API
   ====================================================== */

export const savingsAPI = {
  getAll() {
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
    }>("/savings");
  },

  create(goal: {
    name: string;
    target_amount: number;
    current_amount?: number;
    currency: string;
    deadline?: string;
    description?: string;
  }) {
    return apiRequest("/savings", {
      method: "POST",
      body: JSON.stringify(goal),
    });
  },

  update(id: number, current_amount: number) {
    return apiRequest(`/savings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ current_amount }),
    });
  },

  delete(id: number) {
    return apiRequest(`/savings/${id}`, {
      method: "DELETE",
    });
  },
};

/* ======================================================
   Investments API
   ====================================================== */

export const investmentsAPI = {
  getAll() {
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
    }>("/investments");
  },

  create(investment: {
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
    return apiRequest("/investments", {
      method: "POST",
      body: JSON.stringify(investment),
    });
  },

  update(id: number, current_value: number) {
    return apiRequest(`/investments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ current_value }),
    });
  },

  delete(id: number) {
    return apiRequest(`/investments/${id}`, {
      method: "DELETE",
    });
  },

  getStatistics() {
    return apiRequest<{
      statistics: {
        totalInvested: number;
        totalValue: number;
        totalGainLoss: number;
        investmentCount: number;
      };
    }>("/investments/statistics");
  },
};
