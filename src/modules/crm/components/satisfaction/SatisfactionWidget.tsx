import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/shared/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TriggerType = 'post_booking' | 'post_referral_reward' | 'post_campaign' | 'periodic';

export interface SatisfactionRating {
  id: string;
  patient_id: string;
  rating: number;
  trigger_type: TriggerType;
  comment: string | null;
  created_at: string;
  patient_name?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

function generateMockRatings(): SatisfactionRating[] {
  const triggers: TriggerType[] = ['post_booking', 'post_referral_reward', 'post_campaign', 'periodic'];
  const names = [
    'Sophie Martin', 'Claire Dubois', 'Marie Laurent', 'Julie Bernard',
    'Emma Petit', 'Camille Moreau', 'Lea Thomas', 'Manon Robert',
    'Chloe Richard', 'Ines Durand', 'Alice Leroy', 'Sarah Roux',
    'Lucie Simon', 'Nathalie Michel', 'Isabelle Lefebvre',
  ];
  const comments = [
    'Excellent accueil, je recommande vivement !',
    'Tres satisfaite du resultat.',
    'Le personnel est tres professionnel.',
    'Resultat au-dela de mes attentes.',
    'Bonne experience globale.',
    'Un peu d\'attente mais service top.',
    'Rapport qualite-prix correct.',
    null,
    null,
    null,
  ];

  const ratings: SatisfactionRating[] = [];
  const now = Date.now();

  for (let i = 0; i < 156; i++) {
    // Skew towards high ratings (aesthetic clinic reality)
    const rand = Math.random();
    let rating: number;
    if (rand < 0.45) rating = 10;
    else if (rand < 0.70) rating = 9;
    else if (rand < 0.82) rating = 8;
    else if (rand < 0.90) rating = 7;
    else if (rand < 0.94) rating = 6;
    else if (rand < 0.97) rating = 5;
    else rating = Math.floor(Math.random() * 5);

    const daysAgo = Math.floor(Math.random() * 365);
    ratings.push({
      id: `rating-${i}`,
      patient_id: `patient-${i % 40}`,
      rating,
      trigger_type: triggers[i % triggers.length],
      comment: comments[Math.floor(Math.random() * comments.length)],
      created_at: new Date(now - daysAgo * 86_400_000).toISOString(),
      patient_name: names[i % names.length],
    });
  }

  return ratings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSatisfactionRatings() {
  return useQuery<SatisfactionRating[]>({
    queryKey: ['satisfaction-ratings'],
    queryFn: async () => {
      // Uses demo data until satisfaction_ratings table is created in Supabase.
      // When ready, replace with:
      // const { data } = await supabase
      //   .from('satisfaction_ratings')
      //   .select('*, patients(first_name, last_name)')
      //   .order('created_at', { ascending: false });
      // return data ?? [];
      return generateMockRatings();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── NPS helpers ────────────────────────────────────────────────────────────────

export function computeNPS(ratings: SatisfactionRating[]) {
  if (ratings.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };

  const promoters = ratings.filter(r => r.rating >= 9).length;
  const detractors = ratings.filter(r => r.rating <= 6).length;
  const passives = ratings.length - promoters - detractors;
  const nps = Math.round(((promoters - detractors) / ratings.length) * 100);

  return { nps, promoters, passives, detractors, total: ratings.length };
}

export function getNPSColor(nps: number): string {
  if (nps < 0) return 'text-destructive';
  if (nps < 30) return 'text-yellow-500';
  if (nps < 70) return 'text-emerald-500';
  return 'text-emerald-600';
}

export function getNPSBgColor(nps: number): string {
  if (nps < 0) return 'bg-destructive';
  if (nps < 30) return 'bg-yellow-500';
  if (nps < 70) return 'bg-emerald-500';
  return 'bg-emerald-600';
}

export function getNPSLabel(nps: number): string {
  if (nps < 0) return 'Needs improvement';
  if (nps < 30) return 'Good';
  if (nps < 70) return 'Great';
  return 'Excellent';
}

// ── Widget ─────────────────────────────────────────────────────────────────────

interface SatisfactionWidgetProps {
  compact?: boolean;
}

export function SatisfactionWidget({ compact = false }: SatisfactionWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: ratings = [] } = useSatisfactionRatings();

  // Last 30 days vs previous 30 days for trend
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;
  const sixtyDaysAgo = now - 60 * 86_400_000;

  const recentRatings = ratings.filter(r => new Date(r.created_at).getTime() >= thirtyDaysAgo);
  const previousRatings = ratings.filter(r => {
    const t = new Date(r.created_at).getTime();
    return t >= sixtyDaysAgo && t < thirtyDaysAgo;
  });

  const current = computeNPS(recentRatings);
  const previous = computeNPS(previousRatings);
  const overall = computeNPS(ratings);
  const trend = current.nps - previous.nps;

  return (
    <Card
      className={cn('cursor-pointer transition-colors hover:bg-muted/50', compact && 'p-0')}
      onClick={() => navigate('/crm/satisfaction')}
    >
      <CardHeader className={cn('pb-2', compact && 'p-4 pb-2')}>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Star className="h-4 w-4 text-yellow-500" />
          {t('satisfaction.npsScore', { defaultValue: 'NPS Score' })}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(compact && 'p-4 pt-0')}>
        {/* NPS Score + trend */}
        <div className="flex items-end gap-3 mb-3">
          <span className={cn('text-4xl font-bold tabular-nums', getNPSColor(overall.nps))}>
            {overall.nps > 0 ? '+' : ''}{overall.nps}
          </span>
          <div className="flex items-center gap-1 mb-1">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            {trend !== 0 && (
              <span className={cn('text-sm font-medium', trend > 0 ? 'text-emerald-500' : 'text-destructive')}>
                {trend > 0 ? '+' : ''}{trend}
              </span>
            )}
          </div>
        </div>

        {/* Mini NPS gauge */}
        <div className="mb-3">
          <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
            {/* Gauge fill — map NPS from [-100, 100] to [0%, 100%] */}
            <div
              className={cn('absolute inset-y-0 left-0 rounded-full transition-all', getNPSBgColor(overall.nps))}
              style={{ width: `${Math.max(0, Math.min(100, (overall.nps + 100) / 2))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">-100</span>
            <span className="text-[10px] text-muted-foreground font-medium">{getNPSLabel(overall.nps)}</span>
            <span className="text-[10px] text-muted-foreground">+100</span>
          </div>
        </div>

        {/* Stacked bar */}
        <div className="flex h-3 w-full rounded-full overflow-hidden mb-2">
          {overall.total > 0 && (
            <>
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(overall.promoters / overall.total) * 100}%` }}
              />
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${(overall.passives / overall.total) * 100}%` }}
              />
              <div
                className="bg-destructive transition-all"
                style={{ width: `${(overall.detractors / overall.total) * 100}%` }}
              />
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {t('satisfaction.promoters', { defaultValue: 'Promoters' })} ({overall.promoters})
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
            {t('satisfaction.passives', { defaultValue: 'Passives' })} ({overall.passives})
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
            {t('satisfaction.detractors', { defaultValue: 'Detractors' })} ({overall.detractors})
          </span>
        </div>

        {/* Response count */}
        <p className="mt-2 text-xs text-muted-foreground text-right">
          {t('satisfaction.totalResponses', { defaultValue: '{{count}} responses', count: overall.total })}
        </p>
      </CardContent>
    </Card>
  );
}
