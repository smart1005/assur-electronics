// api.js — single place for all backend calls.
// If the API URL ever changes, change it here only.

const API_BASE = "https://assur-electronics-api.onrender.com/api";

function getToken() {
  // Admin pages use "token"; customer pages use "customerToken".
  // Prefer admin token first so protected admin API calls do not accidentally use a customer token.
  return localStorage.getItem("token") || localStorage.getItem("customerToken");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


function getTokenType() {
  if (localStorage.getItem("token")) return "admin";
  if (localStorage.getItem("customerToken")) return "customer";
  return null;
}

async function tryRefreshToken() {
  const tokenType = getTokenType();
  if (!tokenType) return false;

  const refreshToken =
    tokenType === "admin"
      ? localStorage.getItem("refreshToken")
      : localStorage.getItem("customerRefreshToken");

  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();

    if (tokenType === "admin") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
    } else {
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customerRefreshToken", data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

async function apiRequest(
  path,
  { method = "GET", body, isJson = true } = {},
  _isRetry = false,
) {
  const headers = { ...authHeaders() };
  if (isJson) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !_isRetry) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return apiRequest(path, { method, body, isJson }, true);
      }
    }

   if (response.status === 401) {
     const tokenType = getTokenType();
     if (tokenType === "admin") {
       localStorage.removeItem("token");
       localStorage.removeItem("refreshToken");
       localStorage.removeItem("user");
       window.location.href = "admin.html";
     } else {
       localStorage.removeItem("customerToken");
       localStorage.removeItem("customerRefreshToken");
       localStorage.removeItem("customerUser");
       window.location.href = "login.html";
     }
   }
    throw new Error(data.message || "Request failed");
  }

  return data;
}

const api = {
  // Auth (admin)
  adminLogin: (email, password) =>
    apiRequest("/auth/admin/login", {
      method: "POST",
      body: { email, password },
    }),

  // Auth (customer)
  register: (payload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),
  customerLogin: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  // Products
  getProducts: (query = "") => apiRequest(`/products${query}`),
  getProduct: (id) => apiRequest(`/products/${id}`),
  addProduct: (product) =>
    apiRequest("/products", { method: "POST", body: product }),
  updateProduct: (id, updates) =>
    apiRequest(`/products/${id}`, { method: "PUT", body: updates }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => apiRequest("/categories"),
  addCategory: (name) =>
    apiRequest("/categories", { method: "POST", body: { name } }),

  // Upload
  uploadImage: (base64Image) =>
    apiRequest("/upload/image", {
      method: "POST",
      body: { image: base64Image },
    }),

  // Orders
  getAllOrders: () => apiRequest("/orders"),
  getMyOrders: () => apiRequest("/orders/my-orders"),
  createOrder: (order) =>
    apiRequest("/orders", { method: "POST", body: order }),
  updateOrderStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, { method: "PUT", body: { status } }),

  // Payments
  initializePayment: (payload) =>
    apiRequest("/payments/initialize", { method: "POST", body: payload }),
  verifyPayment: (reference) => apiRequest(`/payments/verify/${reference}`),
};
