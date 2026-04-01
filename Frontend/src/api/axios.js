import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Handle blocked student
    if (error.response?.status === 403 && error.response?.data?.isBlocked) {
      localStorage.clear();
      window.location.href = "/login?blocked=true";
      return Promise.reject(error);
    }

    // Handle server errors — redirect to error page
    if (error.response?.status === 500) {
      window.location.href = "/error?code=500";
      return Promise.reject(error);
    }

    // Handle 404 from API
    if (error.response?.status === 404 && original.url !== "/auth/refresh") {
      window.location.href = "/error?code=404";
      return Promise.reject(error);
    }

    // Handle token refresh
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;