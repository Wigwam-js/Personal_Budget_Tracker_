import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { format } from 'date-fns';
import { Plus, Edit2, Check, X, ArrowDownRight, ArrowUpRight, RefreshCw, Filter, Trash2 } from 'lucide-react';
import { TransactionType } from '../types';
import { cn } from '../lib/utils';

export const Transactions: React.FC = () => {
  const { transactions, accounts, addTransaction, correctCategory, deleteTransaction } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Transaction State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [txType, setTxType] = useState<TransactionType | 'auto'>('auto');
  const [toAccountId, setToAccountId] = useState('');

  // Edit State
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant || !accountId) return;
    if (txType === 'transfer' && !toAccountId) return;

    const isManual = txType !== 'auto';
    const finalType = isManual ? (txType as TransactionType) : 'expense';

    await addTransaction({
      date: new Date().toISOString(),
      amount: parseFloat(amount),
      merchant,
      notes,
      accountId,
      toAccountId: txType === 'transfer' ? toAccountId : undefined,
      category: isManual ? (txType === 'transfer' ? 'Transfer' : 'Manual Entry') : 'Pending...',
      type: finalType,
    }, isManual);

    setAmount('');
    setMerchant('');
    setNotes('');
    setTxType('auto');
    setToAccountId('');
    setIsAdding(false);
  };

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditCategory(tx.category);
    setEditType(tx.type);
  };

  const saveEdit = (id: string) => {
    correctCategory(id, editCategory, editType);
    setEditingId(null);
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'expense': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      case 'income': return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      case 'transfer': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'pass-through': return <Filter className="w-4 h-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    const styles = {
      'expense': 'bg-red-50 text-red-700 border-red-200',
      'income': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'transfer': 'bg-blue-50 text-blue-700 border-blue-200',
      'pass-through': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return cn("px-2 py-0.5 rounded-full text-xs font-medium border", styles[type]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Transactions</h2>
          <p className="text-zinc-500 mt-1">Manage and categorize your financial activity.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add Transaction'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Type</label>
            <select value={txType} onChange={e => setTxType(e.target.value as TransactionType | 'auto')} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              <option value="auto">Auto (AI)</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Amount (₹)</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="0.00" />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Merchant / Description</label>
            <input type="text" required value={merchant} onChange={e => setMerchant(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="e.g. Starbucks" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">{txType === 'transfer' ? 'From Account' : 'Account'}</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {txType === 'transfer' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">To Account</label>
              <select required value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                <option value="" disabled>Select account</option>
                {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Notes (Optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="Helps AI understand..." />
            </div>
          )}
          <div className="lg:col-span-6 flex justify-end mt-2">
            <button type="submit" className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
              {txType === 'auto' ? 'Save & Auto-Categorize' : 'Save Transaction'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Merchant</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium text-right">Amount</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.slice(0, 50).map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                  {format(new Date(tx.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900">
                  {tx.merchant}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-zinc-400 font-normal bg-zinc-100 px-1.5 py-0.5 rounded">
                      {accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'}
                    </span>
                    {tx.type === 'transfer' && tx.toAccountId && (
                      <>
                        <span className="text-xs text-zinc-400">→</span>
                        <span className="text-xs text-zinc-400 font-normal bg-zinc-100 px-1.5 py-0.5 rounded">
                          {accounts.find(a => a.id === tx.toAccountId)?.name || 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                  {tx.notes && <p className="text-xs text-zinc-400 font-normal mt-0.5">{tx.notes}</p>}
                </td>
                <td className="px-6 py-4">
                  {editingId === tx.id ? (
                    <input 
                      type="text" 
                      value={editCategory} 
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {!tx.isAIAnalyzed && <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />}
                      {tx.category}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === tx.id ? (
                    <select 
                      value={editType} 
                      onChange={e => setEditType(e.target.value as TransactionType)}
                      className="w-full px-2 py-1 bg-white border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      disabled={tx.type === 'transfer'}
                    >
                      {tx.type === 'transfer' ? (
                        <option value="transfer">Transfer</option>
                      ) : (
                        <>
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                          <option value="pass-through">Pass-Through</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <span className={getTypeBadge(tx.type)}>
                      {tx.type}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {getTypeIcon(tx.type)}
                    <span className={tx.type === 'expense' ? 'text-zinc-900' : 'text-zinc-500'}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === tx.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => saveEdit(tx.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-zinc-400 hover:bg-zinc-100 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => startEdit(tx)} 
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded"
                        title="Correct AI Categorization"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            No transactions yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};
