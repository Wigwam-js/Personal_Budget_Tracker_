import React from 'react';
import { MonthlySpendingChart, CategoryPieChart } from '../components/Charts';
import { AIInsights } from '../components/AIInsights';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-1">Your financial overview and AI insights.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-6">12-Month Spending Trend</h3>
            <MonthlySpendingChart />
          </section>

          <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Current Month by Category</h3>
            <CategoryPieChart />
          </section>
        </div>

        {/* Right Column: Insights */}
        <div className="space-y-8">
          <AIInsights />
          
          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quick Tip</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              Add a note like "John paid me back for dinner" to a transaction. The AI will automatically recognize it as a pass-through and exclude it from your expenses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
