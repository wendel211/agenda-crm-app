import { supabase } from '@/lib/supabase';
import { toISODate } from '@/lib/format';
import type { Transaction, TransactionKind } from '@/types';

const DEFAULT_PERIOD_DAYS = 30;

function periodStart(days = DEFAULT_PERIOD_DAYS): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
}

export async function listTransactions(
  businessId: string,
  days = DEFAULT_PERIOD_DAYS,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, kind, description, category, amount, date')
    .eq('business_id', businessId)
    .gte('date', periodStart(days))
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => ({ ...row, amount: Number(row.amount) }));
}

interface CreateTransactionInput {
  businessId: string;
  kind: TransactionKind;
  description: string;
  category: string;
  amount: number;
}

export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    business_id: input.businessId,
    kind: input.kind,
    description: input.description,
    category: input.category,
    amount: input.amount,
  });
  if (error) {
    throw new Error(error.message);
  }
}
