/**
 * Shared helper to safely convert Supabase numeric fields to JavaScript numbers
 * Use this everywhere we read numeric columns (purchase_amount, commission_amount, etc.)
 */
export const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};
