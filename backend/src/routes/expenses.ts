import { Router, Request, Response } from "express";
import { parseExpense } from "../services/aiService";
import { createExpense, getAllExpenses, deleteExpense } from "../database/db";

const router = Router();

// POST /api/expenses — Add a new expense via natural language
router.post("/", async (req: Request, res: Response) => {
  const { input } = req.body;

  if (!input || typeof input !== "string" || input.trim() === "") {
    return res
      .status(400)
      .json({ success: false, error: "Input text is required." });
  }

  try {
    const parsed = await parseExpense(input.trim());
    const expense = createExpense({ ...parsed, original_input: input.trim() });
    return res.status(201).json({ success: true, expense });
  } catch (err: any) {
    return res
      .status(400)
      .json({ success: false, error: err.message ?? "Something went wrong." });
  }
});

router.post("/manual", async (req: Request, res: Response) => {
  const { amount, currency, category, description, merchant } = req.body;

  if (!amount || !currency || !category || !description ||!merchant) {
    return res
      .status(400)
      .json({ success: false, error: "Amount, currency, and category are required." });
  }

  try {
    const expense = createExpense({
      amount,
      currency,
      category,
      description,
      merchant,
      original_input: "",
    });
    return res.status(201).json({ success: true, expense });
  } catch (err: any) {
    return res
      .status(400)
      .json({ success: false, error: err.message ?? "Something went wrong." });
  }
});

// GET /api/expenses — Get all expenses
router.get("/", (_req: Request, res: Response) => {
  try {
    const expenses = getAllExpenses();
    return res.json({ success: true, expenses });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch expenses." });
  }
});

// DELETE /api/expenses/:id — Delete an expense
router.delete("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id))
    return res.status(400).json({ success: false, error: "Invalid ID." });

  const deleted = deleteExpense(id);
  if (!deleted)
    return res
      .status(404)
      .json({ success: false, error: "Expense not found." });

  return res.json({ success: true, message: "Expense deleted successfully." });
});

export default router;