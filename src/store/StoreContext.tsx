import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Account, Budget, CategoryCorrection, TransactionType, Due, Investment } from '../types';
import { categorizeTransaction } from '../services/ai';
import { toast } from 'sonner';
import { auth, db } from '../firebase';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, getDocs, writeBatch, increment
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface StoreState {
  user: User | null;
  isAuthReady: boolean;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  corrections: CategoryCorrection[];
  dues: Due[];
  investments: Investment[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'isAIAnalyzed' | 'userId'>, skipAI?: boolean) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAccount: (a: Omit<Account, 'id' | 'userId'>) => Promise<void>;
  updateAccount: (id: string, a: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  correctCategory: (transactionId: string, newCategory: string, newType: TransactionType) => Promise<void>;
  addDue: (d: Omit<Due, 'id' | 'userId'>) => Promise<void>;
  updateDue: (id: string, d: Partial<Due>) => Promise<void>;
  deleteDue: (id: string) => Promise<void>;
  markDuePaid: (id: string) => Promise<void>;
  addInvestment: (i: Omit<Investment, 'id' | 'userId'>) => Promise<void>;
  updateInvestment: (id: string, i: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  refreshNavs: () => Promise<void>;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [corrections, setCorrections] = useState<CategoryCorrection[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setTransactions([]);
      setAccounts([]);
      setBudgets([]);
      setCorrections([]);
      setDues([]);
      setInvestments([]);
      return;
    }

    const userId = user.uid;

    const unsubTransactions = onSnapshot(collection(db, `users/${userId}/transactions`), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });
    const unsubAccounts = onSnapshot(collection(db, `users/${userId}/accounts`), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    const unsubBudgets = onSnapshot(collection(db, `users/${userId}/budgets`), (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
    });
    const unsubCorrections = onSnapshot(collection(db, `users/${userId}/corrections`), (snapshot) => {
      setCorrections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryCorrection)));
    });
    const unsubDues = onSnapshot(collection(db, `users/${userId}/dues`), (snapshot) => {
      setDues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Due)));
    });
    const unsubInvestments = onSnapshot(collection(db, `users/${userId}/investments`), (snapshot) => {
      setInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    });

    return () => {
      unsubTransactions();
      unsubAccounts();
      unsubBudgets();
      unsubCorrections();
      unsubDues();
      unsubInvestments();
    };
  }, [user, isAuthReady]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Failed to log in.");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'isAIAnalyzed' | 'userId'>, skipAI?: boolean) => {
    if (!user) return;
    const tempId = generateId();
    const newTx: Transaction = { ...t, id: tempId, isAIAnalyzed: skipAI || false, userId: user.uid };
    
    try {
      // Optimistic update
      setTransactions(prev => [newTx, ...prev]);

      const batch = writeBatch(db);
      const txRef = doc(db, `users/${user.uid}/transactions/${tempId}`);
      batch.set(txRef, newTx);

      // Update account balances
      let balanceChange = 0;
      if (t.type === 'expense') balanceChange = -t.amount;
      else if (t.type === 'income') balanceChange = t.amount;
      else if (t.type === 'transfer') balanceChange = -t.amount; // From account decreases

      if (balanceChange !== 0) {
        const accountRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`);
        batch.update(accountRef, { balance: increment(balanceChange) });
      }

      if (t.type === 'transfer' && t.toAccountId) {
        const toAccountRef = doc(db, `users/${user.uid}/accounts/${t.toAccountId}`);
        batch.update(toAccountRef, { balance: increment(t.amount) }); // To account increases
      }
      
      await batch.commit();

      if (skipAI) return;

      // AI Categorization
      const { category, type, reasoning } = await categorizeTransaction(t.merchant, t.amount, t.notes, corrections);
      
      // If AI changes the type, we need to adjust the balance again
      if (type !== t.type) {
        // Revert old change
        let revertChange = 0;
        if (t.type === 'expense') revertChange = t.amount;
        else if (t.type === 'income') revertChange = -t.amount;
        else if (t.type === 'transfer') revertChange = t.amount; // We don't revert toAccount here for simplicity, AI shouldn't change transfer type usually.
        
        // Apply new change
        let newChange = 0;
        if (type === 'expense') newChange = -t.amount;
        else if (type === 'income') newChange = t.amount;

        const diff = revertChange + newChange;
        if (diff !== 0) {
          const accountRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`);
          await updateDoc(accountRef, { balance: increment(diff) });
        }
      }

      await updateDoc(txRef, { category, type, isAIAnalyzed: true });
      toast.success(`AI Categorized: ${category} (${type})`, { description: reasoning });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add transaction.');
    }
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    if (!user) return;
    try {
      const txRef = doc(db, `users/${user.uid}/transactions/${id}`);
      await updateDoc(txRef, t);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update transaction.');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        const batch = writeBatch(db);
        batch.delete(doc(db, `users/${user.uid}/transactions/${id}`));
        
        let balanceChange = 0;
        if (tx.type === 'expense') balanceChange = tx.amount;
        else if (tx.type === 'income') balanceChange = -tx.amount;
        else if (tx.type === 'transfer') balanceChange = tx.amount;

        if (balanceChange !== 0) {
          const accountRef = doc(db, `users/${user.uid}/accounts/${tx.accountId}`);
          batch.update(accountRef, { balance: increment(balanceChange) });
        }

        if (tx.type === 'transfer' && tx.toAccountId) {
          const toAccountRef = doc(db, `users/${user.uid}/accounts/${tx.toAccountId}`);
          batch.update(toAccountRef, { balance: increment(-tx.amount) });
        }
        await batch.commit();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete transaction.');
    }
  };

  const addAccount = async (a: Omit<Account, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const id = generateId();
      await setDoc(doc(db, `users/${user.uid}/accounts/${id}`), { ...a, id, userId: user.uid });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add account.');
    }
  };

  const updateAccount = async (id: string, a: Partial<Account>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), a);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update account.');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete account.');
    }
  };

  const addBudget = async (b: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const id = generateId();
      await setDoc(doc(db, `users/${user.uid}/budgets/${id}`), { ...b, id, userId: user.uid });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add budget.');
    }
  };

  const updateBudget = async (id: string, b: Partial<Budget>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/budgets/${id}`), b);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update budget.');
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/budgets/${id}`));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete budget.');
    }
  };

  const correctCategory = async (transactionId: string, newCategory: string, newType: TransactionType) => {
    if (!user) return;
    const tx = transactions.find(t => t.id === transactionId);
    if (tx) {
      try {
        const batch = writeBatch(db);
        
        // Update transaction
        const txRef = doc(db, `users/${user.uid}/transactions/${transactionId}`);
        batch.update(txRef, { category: newCategory, type: newType });
        
        // Adjust account balance if type changed
        if (tx.type !== newType) {
          // Revert old type
          let balanceChange = tx.type === 'expense' ? tx.amount : (tx.type === 'income' ? -tx.amount : 0);
          // Apply new type
          balanceChange += newType === 'expense' ? -tx.amount : (newType === 'income' ? tx.amount : 0);
          
          if (balanceChange !== 0) {
            const accountRef = doc(db, `users/${user.uid}/accounts/${tx.accountId}`);
            batch.update(accountRef, { balance: increment(balanceChange) });
          }
        }

        // Save correction
        const existing = corrections.find(c => c.merchant === tx.merchant);
        if (existing && existing.id) {
          const corrRef = doc(db, `users/${user.uid}/corrections/${existing.id}`);
          batch.update(corrRef, { correctedCategory: newCategory, correctedType: newType });
        } else {
          const newCorrId = generateId();
          const corrRef = doc(db, `users/${user.uid}/corrections/${newCorrId}`);
          batch.set(corrRef, { id: newCorrId, merchant: tx.merchant, correctedCategory: newCategory, correctedType: newType, userId: user.uid });
        }

        await batch.commit();
        toast.success('Correction saved. AI will learn from this.');
      } catch (error) {
        console.error(error);
        toast.error('Failed to save correction.');
      }
    }
  };

  const addDue = async (d: Omit<Due, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const id = generateId();
      await setDoc(doc(db, `users/${user.uid}/dues/${id}`), { ...d, id, userId: user.uid });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add due.');
    }
  };

  const updateDue = async (id: string, d: Partial<Due>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/dues/${id}`), d);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update due.');
    }
  };

  const deleteDue = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/dues/${id}`));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete due.');
    }
  };

  const markDuePaid = async (id: string) => {
    if (!user) return;
    const due = dues.find(d => d.id === id);
    if (due && !due.isPaid) {
      try {
        await updateDue(id, { isPaid: true });
        await addTransaction({
          date: new Date().toISOString(),
          amount: due.amount,
          merchant: due.title,
          category: due.type === 'emi' ? 'EMI/Loan' : 'Bills & Utilities',
          type: 'expense',
          accountId: due.accountId,
          notes: 'Auto-logged from Dues & EMIs',
        });
        toast.success(`${due.title} marked as paid and logged as expense.`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to mark due as paid.');
      }
    }
  };

  const addInvestment = async (i: Omit<Investment, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const id = generateId();
      await setDoc(doc(db, `users/${user.uid}/investments/${id}`), { ...i, id, userId: user.uid });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add investment.');
    }
  };

  const updateInvestment = async (id: string, i: Partial<Investment>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/investments/${id}`), i);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update investment.');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/investments/${id}`));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete investment.');
    }
  };

  const refreshNavs = async () => {
    if (!user) return;
    let updatedCount = 0;
    
    for (const inv of investments) {
      if (inv.type === 'mutual_fund' && inv.schemeCode) {
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${inv.schemeCode}`);
          const data = await res.json();
          if (data && data.data && data.data.length > 0) {
            const latestNav = parseFloat(data.data[0].nav);
            const navDate = data.data[0].date;
            
            if (latestNav !== inv.currentNav || navDate !== inv.navDate) {
              await updateInvestment(inv.id, { currentNav: latestNav, navDate });
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch NAV for ${inv.schemeCode}`, error);
        }
      }
    }
    
    if (updatedCount > 0) {
      toast.success(`Updated NAVs for ${updatedCount} investments.`);
    } else {
      toast.info('All NAVs are up to date.');
    }
  };

  return (
    <StoreContext.Provider value={{
      user, isAuthReady,
      transactions, accounts, budgets, corrections, dues, investments,
      login, logout,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addBudget, updateBudget, deleteBudget,
      correctCategory, addDue, updateDue, deleteDue, markDuePaid,
      addInvestment, updateInvestment, deleteInvestment, refreshNavs
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
