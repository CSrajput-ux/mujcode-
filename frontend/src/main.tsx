
  import { createRoot } from "react-dom/client";
  import axios from 'axios';
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Global Axios Interceptor to attach the auth token to all requests
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  createRoot(document.getElementById("root")!).render(<App />);