// lib/store/memoryStore.ts
import "server-only"
import type {
    Account,
    AccountTransaction,
    Category,
    Cents,
    Expense,
    IsoDate,
    TransactionType,
} from "@/lib/domain/types"

function nowIso(): string {
    return new Date().toISOString()
}

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10)
}

function addDaysIsoDate(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

// NOTE: module-level state resets on dev reload; fine for now.
const accounts: Account[] = []
const transactions: AccountTransaction[] = []
const categories: Category[] = []
const expenses: Expense[] = []

function createAccountInternal(input: { name: string; type: Account["type"] }): Account {
    const a: Account = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        type: input.type,
        createdAt: nowIso(),
        updatedAt: nowIso(),
    }
    accounts.push(a)
    return a
}

function addTransactionInternal(tx: {
    cycleId: string | null
    fromAccountId: string | null
    toAccountId: string | null
    amount: Cents
    type: TransactionType
    referenceId: string | null
    postedDate: string
}): AccountTransaction {
    const t: AccountTransaction = {
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        ...tx,
    }
    transactions.push(t)
    return t
}

function seedCategoriesIfEmpty() {
    if (categories.length > 0) return

    const seeded: Category[] = [
        { id: "cat-groceries", name: "Groceries", type: "VARIABLE", isWeeklyBucket: true },
        { id: "cat-eatingout", name: "Eating out", type: "VARIABLE", isWeeklyBucket: true },
        { id: "cat-transport", name: "Transport", type: "VARIABLE", isWeeklyBucket: true },
        { id: "cat-bills", name: "Bills", type: "FIXED", isWeeklyBucket: false },
        { id: "cat-rent", name: "Rent", type: "FIXED", isWeeklyBucket: false },
        { id: "cat-fun", name: "Fun", type: "VARIABLE", isWeeklyBucket: true },
        { id: "cat-savings", name: "Savings", type: "SAVINGS", isWeeklyBucket: false },
        { id: "cat-system", name: "System", type: "SYSTEM", isWeeklyBucket: false },
    ]

    categories.push(...seeded)
}

function seedIfEmpty() {
    if (accounts.length > 0) return

    seedCategoriesIfEmpty()

    // Accounts
    const checking = createAccountInternal({ name: "Main checking", type: "CHECKING" })
    const cash = createAccountInternal({ name: "Cash envelope", type: "CASH" })
    const s1 = createAccountInternal({ name: "Savings 1", type: "SAVINGS" })
    const s2 = createAccountInternal({ name: "Savings 2", type: "SAVINGS" })
    const es = createAccountInternal({ name: "e-Savings", type: "E_SAVINGS" })

    // Transactions (balances derived)
    // Salary into checking
    addTransactionInternal({
        cycleId: null,
        fromAccountId: null,
        toAccountId: checking.id,
        amount: 550000, // €5,500.00
        type: "SALARY",
        referenceId: "seed",
        postedDate: addDaysIsoDate(-12),
    })

    // Move money to savings
    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: s1.id,
        amount: 120000, // €1,200.00
        type: "TRANSFER",
        referenceId: "seed",
        postedDate: addDaysIsoDate(-10),
    })

    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: s2.id,
        amount: 80000, // €800.00
        type: "TRANSFER",
        referenceId: "seed",
        postedDate: addDaysIsoDate(-9),
    })

    // Cash withdrawal
    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: cash.id,
        amount: 25000, // €250.00
        type: "TRANSFER",
        referenceId: "seed",
        postedDate: addDaysIsoDate(-8),
    })

    // Some expenses from checking (outflow)
    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: null,
        amount: 7350, // €73.50
        type: "EXPENSE",
        referenceId: "seed:grocery",
        postedDate: addDaysIsoDate(-7),
    })

    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: null,
        amount: 4299, // €42.99
        type: "EXPENSE",
        referenceId: "seed:internet",
        postedDate: addDaysIsoDate(-6),
    })

    // Some cash expense (outflow)
    addTransactionInternal({
        cycleId: null,
        fromAccountId: cash.id,
        toAccountId: null,
        amount: 1800, // €18.00
        type: "EXPENSE",
        referenceId: "seed:coffee",
        postedDate: addDaysIsoDate(-5),
    })

    // Roundup to e-savings
    addTransactionInternal({
        cycleId: null,
        fromAccountId: checking.id,
        toAccountId: es.id,
        amount: 320, // €3.20
        type: "SAVINGS_ROUNDUP",
        referenceId: "seed:roundup",
        postedDate: addDaysIsoDate(-5),
    })

    // Another roundup
    addTransactionInternal({
        cycleId: null,
        fromAccountId: cash.id,
        toAccountId: es.id,
        amount: 150, // €1.50
        type: "SAVINGS_ROUNDUP",
        referenceId: "seed:roundup",
        postedDate: addDaysIsoDate(-4),
    })
}

// Seed immediately on module load
function ensureSeeded() {
    seedIfEmpty()
}

// ---- Public API ----

export function listAccounts(): Account[] {
    ensureSeeded()
    return [...accounts].sort((a, b) => a.name.localeCompare(b.name))
}

export function createAccount(input: { name: string; type: Account["type"] }): Account {
    const a = createAccountInternal(input)
    return a
}

export function listTransactions(): AccountTransaction[] {
    // newest first by postedDate, then createdAt
    ensureSeeded()
    return [...transactions].sort((a, b) => {
        if (a.postedDate !== b.postedDate) return a.postedDate < b.postedDate ? 1 : -1
        return a.createdAt < b.createdAt ? 1 : -1
    })
}

export function addTransaction(tx: Omit<AccountTransaction, "id" | "createdAt">): AccountTransaction {
    return addTransactionInternal(tx)
}

export function getAccountBalanceCents(accountId: string): Cents {
    ensureSeeded()
    let balance: Cents = 0
    for (const t of transactions) {
        if (t.toAccountId === accountId) balance += t.amount
        if (t.fromAccountId === accountId) balance -= t.amount
    }
    return balance
}

export function listCategories(): Category[] {
    ensureSeeded()
    return [...categories].sort((a, b) => a.name.localeCompare(b.name))
}

export function listExpenses(): Expense[] {
    ensureSeeded()
    // newest first by expenseDate, then createdAt
    return [...expenses].sort((a, b) => {
        if (a.expenseDate !== b.expenseDate) return a.expenseDate < b.expenseDate ? 1 : -1
        const ac = a.createdAt ?? ""
        const bc = b.createdAt ?? ""
        return ac < bc ? 1 : -1
    })
}

function findEsavingsAccountId(): string | null {
    const es = accounts.find((a) => a.type === "E_SAVINGS")
    return es?.id ?? null
}

function calculateRoundupCents(amountCents: Cents): Cents {
    const remainder = amountCents % 100
    if (remainder === 0) return 0
    return 100 - remainder
}

export function createExpense(input: {
    accountId: string
    categoryId: string
    amount: Cents // positive cents
    description: string
    expenseDate: IsoDate
    enableRoundup: boolean
}): { expense: Expense; expenseTxn: AccountTransaction; roundupTxn: AccountTransaction | null } {
    ensureSeeded()

    const expenseId = crypto.randomUUID()
    const createdAt = nowIso()

    const roundupCents = input.enableRoundup ? calculateRoundupCents(input.amount) : 0
    const esavingsAccountId = roundupCents > 0 ? findEsavingsAccountId() : null

    const expense: Expense = {
        id: expenseId,
        cycleId: "cycle:active", // placeholder until you add real cycles
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description.trim(),
        expenseDate: input.expenseDate,
        weekNumber: null,
        roundupCents: roundupCents > 0 ? roundupCents : null,
        createdAt,
        updatedAt: createdAt,
    }

    expenses.push(expense)

    // Ledger: expense outflow
    const expenseTxn = addTransactionInternal({
        cycleId: expense.cycleId,
        fromAccountId: input.accountId,
        toAccountId: null,
        amount: input.amount,
        type: "EXPENSE",
        referenceId: expenseId,
        postedDate: input.expenseDate,
    })

    // Ledger: optional roundup transfer to E_SAVINGS if present
    const roundupTxn =
        roundupCents > 0
            ? addTransactionInternal({
                cycleId: expense.cycleId,
                fromAccountId: input.accountId,
                toAccountId: esavingsAccountId, // may be null if none exists
                amount: roundupCents,
                type: "SAVINGS_ROUNDUP",
                referenceId: expenseId,
                postedDate: input.expenseDate,
            })
            : null

    return { expense, expenseTxn, roundupTxn }
}