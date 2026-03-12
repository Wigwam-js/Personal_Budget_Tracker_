import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Wallet, CreditCard, Plus, Trash2 } from 'lucide-react';

export const Accounts: React.FC = () => {
  const { accounts, addAccount, deleteAccount } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'credit'>('bank');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;
    
    addAccount({
      name,
      type,
      balance: parseFloat(balance)
    });
    
    setName('');
    setBalance('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Account Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="e.g. HDFC Bank"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'bank' | 'credit')}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="bank">Bank Account</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Initial Balance (₹)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Save Account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                {account.type === 'bank' ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <button
                onClick={() => deleteAccount(account.id)}
                className="text-zinc-400 hover:text-red-500 transition-colors"
                title="Delete Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-medium text-zinc-900 mb-1">{account.name}</h3>
            <p className="text-sm text-zinc-500 capitalize mb-4">{account.type}</p>
            <div className="mt-auto">
              <p className="text-2xl font-bold tracking-tight">
                ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full p-8 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
            No accounts added yet. Click "Add Account" to get started.
          </div>
        )}
      </div>
    </div>
  );
};
