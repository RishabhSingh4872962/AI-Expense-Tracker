import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../expenses.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    merchant TEXT,
    original_input TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export interface Expense {
  id: number;
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
  original_input: string;
  created_at: string;
}

export interface ExpenseInput {
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
  original_input: string;
}

export function createExpense(input: ExpenseInput): Expense {
  const stmt = db.prepare(`
    INSERT INTO expenses (amount, currency, category, description, merchant, original_input)
    VALUES (@amount, @currency, @category, @description, @merchant, @original_input)
  `);
  const result = stmt.run(input);
  return getExpenseById(result.lastInsertRowid as number)!;
}

export function getAllExpenses(): Expense[] {
  return db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all() as Expense[];
}

export function getExpenseById(id: number): Expense | undefined {
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Expense | undefined;
}

export function deleteExpense(id: number): boolean {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return result.changes > 0;
}

export default db;