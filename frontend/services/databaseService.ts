// In-memory database simulation that persists to localStorage.
// This is accessible only from the code, as requested by the user.

const DB_KEY = 'autonomHubDatabase';

interface UserData {
  balance: number;
}

// The "database" is a record of email -> UserData
type Database = Record<string, UserData>;

// Load initial data from localStorage
const loadDatabase = (): Database => {
  try {
    const storedDb = localStorage.getItem(DB_KEY);
    return storedDb ? JSON.parse(storedDb) : {};
  } catch (error) {
    console.error("Failed to load database from localStorage", error);
    return {};
  }
};

// Save data to localStorage
const saveDatabase = (db: Database) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save database to localStorage", error);
  }
};

let db: Database = loadDatabase();

// Simulate async operations to mimic a real backend
const simulateDelay = (ms: number = 20) => new Promise(resolve => setTimeout(resolve, ms));

export const databaseService = {
  async getUser(email: string): Promise<UserData | null> {
    await simulateDelay();
    if (db[email]) {
      return { ...db[email] }; // Return a copy
    }
    return null;
  },

  async createUser(email: string): Promise<UserData> {
    await simulateDelay();
    if (db[email]) {
      // This case should ideally not be hit if checks are done before calling.
      return { ...db[email] };
    }
    const newUser: UserData = { balance: 0 };
    db[email] = newUser;
    saveDatabase(db);
    return { ...newUser };
  },

  async updateUserBalance(email: string, newBalance: number): Promise<UserData | null> {
    await simulateDelay(500); // Increased delay to simulate a network request
    if (db[email]) {
      db[email].balance = newBalance;
      saveDatabase(db);
      return { ...db[email] };
    }
    // This case should not happen for an authenticated user.
    console.error("Attempted to update balance for non-existent user:", email);
    return null;
  }
};