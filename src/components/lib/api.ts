// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g., "https://api.yourdomain.com"
  withCredentials: true, // if using cookies/sessions
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
