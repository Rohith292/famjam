// frontend/src/lib/axios.js
// Configures the Axios instance with interceptors for JWT.
// This version fixes the /auth/check token issue by correctly reading from localStorage
// and always attaching the token if available.
// ==========================================================
import axios from "axios";

export const axiosInstance = axios.create({
    // Use VITE_API_URL from environment variables, fallback to localhost for dev
    baseURL:  'https://famjam-725r.onrender.com',
    withCredentials: true, // Essential for sending cookies (http-only cookies from the backend).
});

axiosInstance.interceptors.request.use(
    (config) => {
        // If the Authorization header is not already set by useAuthStore (e.g., on initial page load),
        // try to read from localStorage.
        if (!config.headers.Authorization) {
            const authUserString = localStorage.getItem('authUser');
            let token = null;

            if (authUserString) {
                try {
                    const authUser = JSON.parse(authUserString);
                    token = authUser.token;
                } catch (e) {
                    console.error("[Axios Request Interceptor] Error parsing authUser from localStorage:", e);
                    localStorage.removeItem('authUser');
                }
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log(`[Axios Request Interceptor] Authorization header set from localStorage for: ${config.url}`);
            } else {
                console.log(`[Axios Request Interceptor] No token found in localStorage for: ${config.url}. Authorization header NOT set.`);
            }
        } else {
            console.log(`[Axios Request Interceptor] Authorization header already present for: ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle token expiration or unauthorized responses
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = originalRequest.url;

        const isPublicShareApiCall = url.includes('/family/map') && originalRequest.params && originalRequest.params.shareId;

        // Handle 401 Unauthorized errors (e.g., token expired).
        // We only want to redirect if:
        // 1. It's a 401 status.
        // 2. The request hasn't already been retried.
        // 3. It's NOT a public share API call (which might be accessible without auth).
        // 4. It's NOT the login or signup route itself (to prevent loops).
        // 5. It's NOT the /auth/check route (the checkAuth function handles its own logout logic).
        if (status === 401 && !originalRequest._retry && !isPublicShareApiCall &&
            !url.includes('/auth/login') && !url.includes('/auth/signup') &&
            !url.includes('/auth/check')) {

            originalRequest._retry = true; // Mark the request as retried to prevent infinite loops

            console.warn("401 Unauthorized: Token expired or invalid. Forcing logout.");
            // Clear the correct localStorage key
            localStorage.removeItem('authUser');
            // Also clear the default Authorization header from Axios
            delete axiosInstance.defaults.headers.common['Authorization'];
            // Force a page reload and redirect to login page
            window.location.href = '/login';
        } else if (status === 403 && !originalRequest._retry) {
            console.warn("403 Forbidden: You do not have permission for this action.");
            // You might want to display a toast here or redirect to an access denied page
            // toast.error("You do not have permission to perform this action.");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

