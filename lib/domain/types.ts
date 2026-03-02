// /lib/domain/types.ts

// ---- Core Enums ----
export type CycleStatus = 'ACTIVE' | 'CLOSED';

export type CategoryType =
    | 'FIXED'
    | 'VARIABLE'
    | 'SAVINGS'
    | 'SYSTEM';

export type AccountType =
    | 'CHECKING'
    | 'CASH'
    | 'SAVINGS'
    | 'E_SAVINGS';

export type TransactionType =
    | 'SALARY'
    | 'EXPENSE'
    | 'TRANSFER'
    | 'SAVINGS_ROUNDUP';

// ---- Shared Types ----

export type IsoDate = string // YYYY-MM-DD
export type IsoDateTime = string // ISO datetime string
export type Cents = number

// ---- Domain Models ----

export interface Cycle {
    id: string
    startDate: IsoDate
    endDate: IsoDate | null
    salaryAmount: Cents // configured salary for this cycle
    status: CycleStatus
    createdAt: IsoDateTime
    updatedAt: IsoDateTime
}

export interface Category {
    id: string
    name: string
    type: CategoryType
    isWeeklyBucket: boolean
}

export interface PlanningItem {
    id: string
    cycleId: string
    categoryId: string
    quantity: number
    unitPrice: Cents
    weekNumber: number | null
    createdAt?: IsoDateTime
    updatedAt?: IsoDateTime
    // plannedTotal is derived: quantity * unitPrice
}

export interface Expense {
    id: string
    cycleId: string
    categoryId: string
    amount: Cents
    description: string
    expenseDate: IsoDate
    weekNumber: number | null
    roundupCents: Cents | null // optional, ledger still stores separate txn
    createdAt?: IsoDateTime
    updatedAt?: IsoDateTime
}

export interface Account {
    id: string
    name: string
    type: AccountType
    createdAt?: IsoDateTime
    updatedAt?: IsoDateTime
}

export interface AccountTransaction {
    id: string
    cycleId: string | null
    // ledger legs
    fromAccountId: string | null
    toAccountId: string | null
    amount: Cents
    type: TransactionType
    // link back to domain event (expenseId, cycleId for salary injection, etc.)
    referenceId: string | null
    // when the transaction is considered effective (important!)
    postedDate: IsoDate// when it was entered into the system
    createdAt: IsoDateTime
}