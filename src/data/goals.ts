import { supabase } from '@/lib/supabase';
import { toISODate } from '@/lib/format';
import type { Goal } from '@/types';

export async function listGoals(businessId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, title, kind, target, current, unit, deadline')
    .eq('business_id', businessId)
    .order('deadline');
  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => ({ ...row, target: Number(row.target), current: Number(row.current) }));
}

/**
 * Metas de negócio têm progresso calculado do mês corrente:
 * faturamento vem das receitas, volume vem dos atendimentos concluídos.
 * Metas pessoais (ex.: reserva) continuam com progresso manual.
 */
export async function listGoalsWithProgress(businessId: string): Promise<Goal[]> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const since = toISODate(monthStart);

  const [goals, revenueResult, doneResult] = await Promise.all([
    listGoals(businessId),
    supabase
      .from('transactions')
      .select('amount')
      .eq('business_id', businessId)
      .eq('kind', 'receita')
      .gte('date', since),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'concluido')
      .gte('date', since),
  ]);
  if (revenueResult.error) {
    throw new Error(revenueResult.error.message);
  }
  if (doneResult.error) {
    throw new Error(doneResult.error.message);
  }

  const monthRevenue = revenueResult.data.reduce((sum, row) => sum + Number(row.amount), 0);
  const monthDone = doneResult.count ?? 0;

  return goals.map((goal) => {
    if (goal.kind !== 'profissional') {
      return goal;
    }
    return { ...goal, current: goal.unit === 'BRL' ? monthRevenue : monthDone };
  });
}

interface CreateGoalInput {
  businessId: string;
  title: string;
  kind: Goal['kind'];
  target: number;
  unit: Goal['unit'];
  deadline: string;
}

export async function createGoal(input: CreateGoalInput): Promise<void> {
  const { error } = await supabase.from('goals').insert({
    business_id: input.businessId,
    title: input.title,
    kind: input.kind,
    target: input.target,
    unit: input.unit,
    deadline: input.deadline,
  });
  if (error) {
    throw new Error(error.message);
  }
}
