import { supabase } from '@/lib/supabase';
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
