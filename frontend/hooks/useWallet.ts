
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { databaseService } from '../services/databaseService';

export const useWallet = () => {
    const { userEmail, isAuthenticated } = useAuth();
    const [balance, setBalance] = useState<number>(0);

    // Effect to fetch balance when user logs in or changes
    useEffect(() => {
        const fetchBalance = async () => {
            if (isAuthenticated && userEmail) {
                try {
                    const user = await databaseService.getUser(userEmail);
                    setBalance(user?.balance ?? 0);
                } catch (error) {
                    console.error("Failed to fetch wallet balance:", error);
                    setBalance(0);
                }
            } else {
                // Reset balance when logged out
                setBalance(0);
            }
        };
        fetchBalance();
    }, [isAuthenticated, userEmail]);

    const addFunds = useCallback(async (amount: number) => {
        if (!userEmail) return;
        
        // Fetch the latest state from the "backend" to avoid stale closures
        const user = await databaseService.getUser(userEmail);
        const currentBalance = user?.balance ?? 0;

        const newBalance = currentBalance + amount;
        await databaseService.updateUserBalance(userEmail, newBalance);
        setBalance(newBalance);
    }, [userEmail]);

    const charge = useCallback(async (amount: number) => {
        if (!userEmail) return false;

        // Fetch the latest state from the "backend" for accuracy
        const user = await databaseService.getUser(userEmail);
        const currentBalance = user?.balance ?? 0;

        if (currentBalance < amount) {
            return false; // insufficient funds
        }
        
        const newBalance = currentBalance - amount;
        await databaseService.updateUserBalance(userEmail, newBalance);
        setBalance(newBalance);
        return true; // transaction successful
    }, [userEmail]);

    return { balance, addFunds, charge };
};