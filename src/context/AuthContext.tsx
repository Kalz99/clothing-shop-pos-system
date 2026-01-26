import { createContext, useContext, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { User, Role, AuthState } from '../types';
import api from '../lib/axios';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('pos_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (username: string, password: string, role: Role): Promise<boolean> => {
        try {
            const res = await api.post('/auth/login', { username, password, role });
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem('pos_user', JSON.stringify(userData));
            toast.success(`Welcome back, ${userData.name}!`);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            toast.error('Login failed. Please check your credentials.');
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pos_user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
