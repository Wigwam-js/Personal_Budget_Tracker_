import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Landmark, TrendingUp, Plus, Trash2, RefreshCw } from 'lucide-react';

export const Investments: React.FC = () => {
  const { investments, addInvestment, deleteInvestment, refreshNavs } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'mutual_fund' | 'equity'>('mutual_fund');
  const [schemeCode, setSchemeCode] = useState('');
  const [units, setUnits] = useState('');
  const [averageNav, setAverageNav] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !units) return;
    
    addInvestment({
      name,
      type,
      schemeCode: type === 'mutual_fund' ? schemeCode : undefined,
      units: parseFloat(units),
      averageNav: averageNav ? parseFloat(averageNav) : undefined,
    });
    
    setName('');
    setSchemeCode('');
    setUnits('');
    setAverageNav('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Investments</h2>
        <div className="flex gap-3">
          <button
            onClick={refreshNavs}
            className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh NAVs
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="e.g. Parag Parikh Flexi Cap"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'mutual_fund' | 'equity')}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="mutual_fund">Mutual Fund</option>
                <option value="equity">Equity / Stocks</option>
              </select>
            </div>
            {type === 'mutual_fund' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Scheme Code (mfapi.in)</label>
                <input
                  type="text"
                  value={schemeCode}
                  onChange={(e) => setSchemeCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g. 122639"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Units</label>
              <input
                type="number"
                step="0.001"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Avg NAV / Buy Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={averageNav}
                onChange={(e) => setAverageNav(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end lg:col-span-1">
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.map((inv) => {
          const currentValue = inv.units * (inv.currentNav || inv.averageNav || 0);
          const investedValue = inv.units * (inv.averageNav || 0);
          const returns = currentValue - investedValue;
          const returnPercentage = investedValue > 0 ? (returns / investedValue) * 100 : 0;
          const isPositive = returns >= 0;

          return (
            <div key={inv.id} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  {inv.type === 'mutual_fund' ? <Landmark className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </div>
                <button
                  onClick={() => deleteInvestment(inv.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                  title="Delete Investment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-medium text-zinc-900 mb-1 truncate" title={inv.name}>{inv.name}</h3>
              <p className="text-sm text-zinc-500 capitalize mb-4">
                {inv.type.replace('_', ' ')} {inv.schemeCode ? `(${inv.schemeCode})` : ''}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-zinc-500">Units</p>
                  <p className="font-medium text-zinc-900">{inv.units}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Current NAV</p>
                  <p className="font-medium text-zinc-900">₹{inv.currentNav || inv.averageNav || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-500 mb-1">Current Value</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight">
                    ₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {investedValue > 0 && (
                    <div className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{returns.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({returnPercentage.toFixed(2)}%)
                    </div>
                  )}
                </div>
                {inv.navDate && (
                  <p className="text-xs text-zinc-400 mt-2">Last updated: {inv.navDate}</p>
                )}
              </div>
            </div>
          );
        })}
        {investments.length === 0 && (
          <div className="col-span-full p-8 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
            No investments added yet. Click "Add Investment" to get started.
          </div>
        )}
      </div>
    </div>
  );
};
