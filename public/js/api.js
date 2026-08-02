// api.js — single place for all backend calls.
// If the API URL ever changes, change it here only.

const API_BASE = "https://assur-electronics-api.onrender.com/api";

function getToken() {
  // Customer pages use "customerToken"; admin pages use "token".
  // Prefer whichever is present — a given page will only ever have set one of them.
  return localStorage.getItem("customerToken") || localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, { method = "GET", body, isJson = true } = {}) {
  const headers = { ...authHeaders() };
  if (isJson) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Token expired or invalid — send the right kind of user back to their login
    if (response.status === 401) {
      if (localStorage.getItem("customerToken")) {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        window.location.href = "login.html";
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "admin.html";
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
