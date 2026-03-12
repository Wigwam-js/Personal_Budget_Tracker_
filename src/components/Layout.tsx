import React from 'react';
import { useStore } from '../store/StoreContext';
import { Wallet, CreditCard, TrendingUp, LayoutDashboard, PieChart, List, Target, MessageSquare, CalendarClock, LogIn, LogOut, Landmark } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { accounts, investments, user, isAuthReady, login, logout } = useStore();
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + (inv.units * (inv.currentNav || inv.averageNav || 0)), 0);
  const netWorth = totalBalance + totalInvestments;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'transactions', label: 'Transactions', icon: List },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'dues', label: 'EMIs & Dues', icon: CalendarClock },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'investments', label: 'Investments', icon: Landmark },
  ];

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="animate-pulse text-zinc-500">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">AI Expense Tracker</h1>
          <p className="text-zinc-500 mb-8">Sign in to sync your expenses, budgets, and investments securely to the cloud.</p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-4 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            AI Expense
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-zinc-100 text-zinc-900" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 m-4 bg-zinc-50 rounded-xl border border-zinc-100">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Net Worth</p>
          <p className="text-2xl font-semibold">₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          
          <div className="mt-4 space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-600">
                  {acc.type === 'bank' ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  <span className="truncate w-20">{acc.name}</span>
                </div>
                <span className="font-medium">₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
