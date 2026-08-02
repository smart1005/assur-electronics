// auth.js — checks that an admin is logged in before showing an admin page.
// Include this on every admin-*.html page except admin-login.html.

(function requireAdminLogin() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    window.location.href = "admin.html";
    return;
  }

  const user = JSON.parse(userRaw);
  if (user.role !== "admin" && user.role !== "superadmin") {
    window.location.href = "admin.html";
  }
})();

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "admin.html";
}
