import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Plus, Target, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const Budgets: React.FC = () => {
  const { budgets, transactions, addBudget, deleteBudget } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;
    addBudget({ category, amount: parseFloat(amount) });
    setCategory('');
    setAmount('');
    setIsAdding(false);
  };

  const budgetProgress = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    
    const currentMonthExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })
    );

    return budgets.map(budget => {
      const spent = currentMonthExpenses
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = Math.min((spent / budget.amount) * 100, 100);
      const isNearLimit = percentage >= 80 && percentage < 100;
      const isExceeded = percentage >= 100;

      return { ...budget, spent, percentage, isNearLimit, isExceeded };
    });
  }, [budgets, transactions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Budgets</h2>
          <p className="text-zinc-500 mt-1">Set limits and track your monthly spending.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'New Budget'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-end gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-zinc-500">Category</label>
            <input type="text" required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="e.g. Dining Out" />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-zinc-500">Monthly Limit (₹)</label>
            <input type="number" step="1" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="0.00" />
          </div>
          <button type="submit" className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors h-[38px]">
            Save Budget
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetProgress.map((budget) => (
          <div key={budget.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative group">
            <button 
              onClick={() => deleteBudget(budget.id)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                budget.isExceeded ? "bg-red-100 text-red-600" : 
                budget.isNearLimit ? "bg-amber-100 text-amber-600" : 
                "bg-zinc-100 text-zinc-600"
              )}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{budget.category}</h3>
                <p className="text-sm text-zinc-500">₹{budget.spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })} of ₹{budget.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className={cn(
                  budget.isExceeded ? "text-red-600" : 
                  budget.isNearLimit ? "text-amber-600" : 
                  "text-zinc-600"
                )}>
                  {budget.percentage.toFixed(0)}% Spent
                </span>
                <span className="text-zinc-500">
                  ₹{Math.max(budget.amount - budget.spent, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} left
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    budget.isExceeded ? "bg-red-500" : 
                    budget.isNearLimit ? "bg-amber-500" : 
                    "bg-zinc-900"
                  )}
                  style={{ width: `${budget.percentage}%` }}
                />
              </div>
            </div>

            {(budget.isNearLimit || budget.isExceeded) && (
              <div className={cn(
                "mt-4 flex items-start gap-2 text-xs p-3 rounded-lg",
                budget.isExceeded ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  {budget.isExceeded 
                    ? "You've exceeded your monthly budget for this category." 
                    : "You're approaching your monthly limit. Watch your spending!"}
                </p>
              </div>
            )}
          </div>
        ))}

        {budgets.length === 0 && (
          <div className="col-span-full p-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 rounded-2xl">
            No budgets set. Create one to start tracking your spending goals!
          </div>
        )}
      </div>
    </div>
  );
};
