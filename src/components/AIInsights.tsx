import React, { useEffect, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { analyzeSpendingSpikes } from '../services/ai';
import { Sparkles, Loader2 } from 'lucide-react';

export const AIInsights: React.FC = () => {
  const { transactions } = useStore();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const result = await analyzeSpendingSpikes(transactions);
        setInsights(result);
      } catch (error) {
        console.error("Failed to fetch insights", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have transactions
    if (transactions.length > 0) {
      fetchInsights();
    }
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Analyzing spending patterns...</span>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900 text-zinc-50 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-zinc-400" />
        <h3 className="text-lg font-medium tracking-tight">AI Spending Insights</h3>
      </div>
      <ul className="space-y-3">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
};
