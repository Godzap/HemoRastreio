import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && originalRequest) {
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    }
                    return api(originalRequest);
                } catch {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            } else {
                // No refresh token, redirect to login
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),

    logout: (refreshToken?: string) =>
        api.post('/auth/logout', { refreshToken }),

    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),

    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/auth/password/change', { currentPassword, newPassword }),

    getCurrentUser: () =>
        api.post('/auth/me'),
};

// Laboratory API
export const laboratoryApi = {
    getAll: () => api.get('/laboratories'),
    getCurrent: () => api.get('/laboratories/current'),
    getById: (id: string) => api.get(`/laboratories/${id}`),
    getStatistics: (id: string) => api.get(`/laboratories/${id}/statistics`),
    create: (data: Record<string, unknown>) => api.post('/laboratories', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/laboratories/${id}`, data),
};

// Sample API
export const sampleApi = {
    getAll: (params?: Record<string, unknown>) => api.get('/samples', { params }),
    getById: (id: string) => api.get(`/samples/${id}`),
    getByBarcode: (barcode: string) => api.get(`/samples/barcode/${barcode}`),
    getHistory: (id: string) => api.get(`/samples/${id}/history`),
    getExpiring: (days?: number) => api.get('/samples/expiring', { params: { days } }),
    create: (data: Record<string, unknown>) => api.post('/samples', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/samples/${id}`, data),
    move: (id: string, data: { toPositionId: string; reason?: string; notes?: string }) =>
        api.post(`/samples/${id}/move`, data),
    changeStatus: (id: string, data: { status: string; reason?: string; notes?: string }) =>
        api.post(`/samples/${id}/status`, data),
    delete: (id: string) => api.delete(`/samples/${id}`),
};

// Storage API
export const storageApi = {
    getHierarchy: () => api.get('/storage/hierarchy'),
    getOccupancy: () => api.get('/storage/occupancy'),

    // Rooms
    getRooms: () => api.get('/storage/rooms'),
    getRoomById: (id: string) => api.get(`/storage/rooms/${id}`),
    createRoom: (data: Record<string, unknown>) => api.post('/storage/rooms', data),
    updateRoom: (id: string, data: Record<string, unknown>) => api.patch(`/storage/rooms/${id}`, data),

    // Freezers
    getFreezers: () => api.get('/storage/freezers'),
    getFreezerById: (id: string) => api.get(`/storage/freezers/${id}`),
    createFreezer: (data: Record<string, unknown>) => api.post('/storage/freezers', data),
    updateFreezer: (id: string, data: Record<string, unknown>) => api.patch(`/storage/freezers/${id}`, data),

    // Boxes
    getBoxes: () => api.get('/storage/boxes'),
    getBoxById: (id: string) => api.get(`/storage/boxes/${id}`),
    createBox: (data: Record<string, unknown>) => api.post('/storage/boxes', data),
    updateBox: (id: string, data: Record<string, unknown>) => api.patch(`/storage/boxes/${id}`, data),

    // Positions
    getAvailablePositions: (boxId?: string) =>
        api.get('/storage/positions/available', { params: { boxId } }),
    togglePositionBlock: (id: string, isBlocked: boolean) =>
        api.patch(`/storage/positions/${id}/block`, { isBlocked }),
};

export default api;
