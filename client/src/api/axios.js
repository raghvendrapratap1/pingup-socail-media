import axios from "axios";

const baseURL = import.meta.env.VITE_BASEURL || "http://localhost:4000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;


