import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { parseChatInput } from '../services/ai';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export const Chat: React.FC = () => {
  const { accounts, addTransaction, addDue } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hi! I am your AI financial assistant. You can tell me things like "I spent ₹450 on coffee" or "Remind me to pay my ₹12000 car EMI on the 5th". How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await parseChatInput(userMsg, accounts);
      
      if (response.action === 'add_transaction' && response.transaction) {
        await addTransaction({
          date: new Date().toISOString(),
          amount: response.transaction.amount || 0,
          merchant: response.transaction.merchant || 'Unknown',
          notes: response.transaction.notes || '',
          accountId: response.transaction.accountId || accounts[0].id,
          category: 'Pending...',
          type: 'expense'
        });
      } else if (response.action === 'add_due' && response.due) {
        addDue({
          title: response.due.title || 'Unknown Due',
          amount: response.due.amount || 0,
          dueDate: response.due.dueDate || new Date().toISOString(),
          type: (response.due.type as 'emi' | 'bill') || 'bill',
          isPaid: false,
          accountId: response.due.accountId || accounts[0].id
        });
        toast.success('Added to EMIs & Dues');
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: response.responseMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Sorry, I encountered an error processing that.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900">AI Assistant</h2>
          <p className="text-xs text-zinc-500">Log transactions naturally</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-200' : 'bg-zinc-900'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-600" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-tr-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'}`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-zinc-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Spent ₹1500 on groceries from Nature's Basket..."
            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
