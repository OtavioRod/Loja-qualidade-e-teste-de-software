"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

Aurora.api = {
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const token = localStorage.getItem("aurora-token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const error = new Error((data && data.error) || "Falha na requisição.");
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: "POST", body });
  },

  put(path, body) {
    return this.request(path, { method: "PUT", body });
  },
};
