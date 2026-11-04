"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

function renderSession() {
  const chip = document.getElementById("session-chip");
  const login = document.getElementById("nav-login");
  const logout = document.getElementById("logout-button");
  const admin = document.getElementById("nav-admin");
  if (!Aurora.state.user) {
    chip.textContent = "";
    login.hidden = false;
    logout.hidden = true;
    admin.hidden = true;
    return;
  }
  chip.textContent = `Olá, ${Aurora.state.user.name}`;
  login.hidden = true;
  logout.hidden = false;
  admin.hidden = false;
}

Aurora.renderSession = renderSession;

Aurora.restoreSession = async function restoreSession() {
  const token = localStorage.getItem("aurora-token");
  if (!token) {
    renderSession();
    return;
  }
  try {
    const data = await Aurora.api.get("/api/auth/me");
    Aurora.state.user = data.user;
  } catch (error) {
    localStorage.removeItem("aurora-token");
    Aurora.state.user = null;
  }
  renderSession();
};

function rememberUser(result) {
  localStorage.setItem("aurora-token", result.token);
  Aurora.state.user = result.user;
  renderSession();
  location.hash = "#catalogo";
}

Aurora.initAuth = function initAuth() {
  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("login-error");
    error.textContent = "";
    try {
      const result = await Aurora.api.post("/api/auth/login", {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      });
      rememberUser(result);
    } catch (err) {
      error.textContent = err.message;
    }
  });

  document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("register-error");
    error.textContent = "";
    try {
      const result = await Aurora.api.post("/api/auth/register", {
        name: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
      });
      rememberUser(result);
    } catch (err) {
      error.textContent = err.message;
    }
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    try {
      await Aurora.api.post("/api/auth/logout", {});
    } catch (error) {
      /* a sessão local é encerrada mesmo se a rede falhar */
    }
    localStorage.removeItem("aurora-token");
    Aurora.state.user = null;
    renderSession();
    location.hash = "#catalogo";
  });
};
