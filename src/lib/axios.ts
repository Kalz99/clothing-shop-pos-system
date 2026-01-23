import axios from 'axios';

const api = axios.create({
    baseURL: 'https://lazaro.luxn.lk/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
