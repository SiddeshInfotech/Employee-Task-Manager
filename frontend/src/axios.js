import axios from "axios";

export const showToast = (message, type = "info") => {
    console.log(`[Toast Notification - ${type.toUpperCase()}]:`, message);
    alert(message);
};

const api = axios.create({
    baseURL: "http://127.0.0.1:8001/api",
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
        return config;
    },
    (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response ${response.status}]`, response.config.url);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`[API Error ${error.response.status}]`, error.config?.url, error.response.data);
        } else if (error.request) {
            console.error(`[API Network Error] No response received for ${error.config?.url}:`, error.message);
        } else {
            console.error(`[API Error]`, error.message);
        }
        return Promise.reject(error);
    }
);

export default api;