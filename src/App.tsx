/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider } from './store/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Transactions } from './views/Transactions';
import { Budgets } from './views/Budgets';
import { Chat } from './views/Chat';
import { Dues } from './views/Dues';
import { Accounts } from './views/Accounts';
import { Investments } from './views/Investments';
import { Toaster } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <StoreProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'accounts' && <Accounts />}
        {activeTab === 'dues' && <Dues />}
        {activeTab === 'budgets' && <Budgets />}
        {activeTab === 'investments' && <Investments />}
      </Layout>
      <Toaster position="top-right" richColors />
    </StoreProvider>
  );
}
