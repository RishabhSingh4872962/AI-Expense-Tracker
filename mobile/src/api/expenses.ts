import { API_BASE_URL } from '../config/api';
import { Expense } from '../types';

export const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await fetch(`${API_BASE_URL}/api/expenses`);
  const data = await res.json();
  if (!data.success) throw new Error('Fetch failed');
  return data.expenses;
};

export const addExpenseNL = async (input: string): Promise<Expense> => {
  const res = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Add failed');
  return data.expense;
};

export const addExpenseManual = async (payload: {
  amount: number; currency: string; category: string;
  description: string; merchant: string;
}): Promise<Expense> => {
  const res = await fetch(`${API_BASE_URL}/api/expenses/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Add failed');
  return data.expense;
};

export const deleteExpense = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error('Delete failed');
};