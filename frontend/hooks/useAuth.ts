
import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';

const SESSION_KEY = 'autonomHubActiveUser';

export const useAuth = () => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for an active session on component mount
        try {
            const sessionEmail = sessionStorage.getItem(SESSION_KEY);
            if (sessionEmail) {
                setUserEmail(sessionEmail);
            }
        } catch (error) {
            console.error("Failed to read session state", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string) => {
        try {
            let user = await databaseService.getUser(email);
            if (!user) {
                await databaseService.createUser(email);
            }
            // Set the active session
            sessionStorage.setItem(SESSION_KEY, email);
            setUserEmail(email);
        } catch (error) {
            console.error("Login failed:", error);
            // Optionally, handle error state here for the UI
        }
    }, []);

    const logout = useCallback(() => {
        try {
            // Clear the active session
            sessionStorage.removeItem(SESSION_KEY);
            setUserEmail(null);
        } catch (error) {
            console.error("Failed to remove session state from storage", error);
        }
    }, []);

    return { userEmail, login, logout, isAuthenticated: !isLoading && !!userEmail };
};
