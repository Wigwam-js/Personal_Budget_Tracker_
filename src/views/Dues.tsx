import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Plus, Check, X, CalendarClock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export const Dues: React.FC = () => {
  const { dues, accounts, addDue, deleteDue, markDuePaid } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'emi' | 'bill'>('emi');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    addDue({
      title,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      type,
      isPaid: false,
      accountId
    });

    setTitle('');
    setAmount('');
    setDueDate('');
    setIsAdding(false);
  };

  const pendingDues = dues.filter(d => !d.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paidDues = dues.filter(d => d.isPaid).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">EMIs & Dues</h2>
          <p className="text-zinc-500 mt-1">Track your upcoming bills and loan payments.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add Due'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Title / Description</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="e.g. Car EMI" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Amount (₹)</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Due Date</label>
            <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Type</label>
            <select value={type} onChange={e => setType(e.target.value as 'emi' | 'bill')} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              <option value="emi">EMI / Loan</option>
              <option value="bill">Utility / Bill</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Pay From</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-6 flex justify-end mt-2">
            <button type="submit" className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
              Save Due
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-500" />
            Upcoming
          </h3>
          <div className="space-y-3">
            {pendingDues.length === 0 ? (
              <p className="text-sm text-zinc-500 p-4 bg-zinc-50 rounded-xl border border-zinc-100">No upcoming dues.</p>
            ) : pendingDues.map(due => {
              const account = accounts.find(a => a.id === due.accountId);
              const isOverdue = new Date(due.dueDate) < new Date();
              
              return (
                <div key={due.id} className={cn("bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between", isOverdue ? "border-red-200 bg-red-50/30" : "border-zinc-200")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", due.type === 'emi' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">{due.title}</h4>
                      <p className={cn("text-xs mt-0.5", isOverdue ? "text-red-600 font-medium" : "text-zinc-500")}>
                        Due: {format(new Date(due.dueDate), 'MMM d, yyyy')} • {account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900">₹{due.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <button 
                      onClick={() => markDuePaid(due.id)}
                      className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                      title="Mark as Paid"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteDue(due.id)}
                      className="p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-500" />
            Paid Recently
          </h3>
          <div className="space-y-3">
            {paidDues.length === 0 ? (
              <p className="text-sm text-zinc-500 p-4 bg-zinc-50 rounded-xl border border-zinc-100">No paid dues yet.</p>
            ) : paidDues.slice(0, 10).map(due => (
              <div key={due.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex items-center justify-between opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-500 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-700 line-through">{due.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Was due: {format(new Date(due.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-zinc-500">₹{due.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
