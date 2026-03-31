import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { formatDate } from '@/shared/lib/format';
import {
  useSatisfactionRatings,
  computeNPS,
  getNPSColor,
  getNPSBgColor,
  getNPSLabel,
  type SatisfactionRating,
  type TriggerType,
} from '../components/satisfaction/SatisfactionWidget';

// Lazy-loaded chart components
const NPSTrendChart = lazy(() =>
  import('../components/satisfaction/NPSTrendChart').then(m => ({ default: m.NPSTrendChart }))
);
const RatingDistributionChart = lazy(() =>
  import('../components/satisfaction/RatingDistributionChart').then(m => ({ default: m.RatingDistributionChart }))
);
const TriggerAnalysisChart = lazy(() =>
  import('../components/satisfaction/TriggerAnalysisChart').then(m => ({ default: m.TriggerAnalysisChart }))
);

function ChartLoader() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

// ── Trigger labels ─────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  post_booking: 'Post-booking',
  post_referral_reward: 'Referral reward',
  post_campaign: 'Post-campaign',
  periodic: 'Periodic',
};

function triggerBadgeVariant(trigger: TriggerType): 'default' | 'secondary' | 'outline' {
  switch (trigger) {
    case 'post_booking': return 'default';
    case 'post_referral_reward': return 'secondary';
    default: return 'outline';
  }
}

// ── Rating star display ────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  const color = rating >= 9 ? 'text-emerald-500' : rating >= 7 ? 'text-yellow-500' : 'text-destructive';
  return (
    <span className={cn('text-lg font-bold tabular-nums', color)}>
      {rating}/10
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SatisfactionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: ratings = [], isLoading } = useSatisfactionRatings();

  const overall = useMemo(() => computeNPS(ratings), [ratings]);

  // Recent ratings for timeline (last 20)
  const recentRatings = useMemo(() => ratings.slice(0, 20), [ratings]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('satisfaction.pageTitle', { defaultValue: 'Patient Satisfaction' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('satisfaction.pageDescription', {
              defaultValue: 'NPS score, ratings analysis and patient feedback',
            })}
          </p>
        </div>
      </div>

      {/* NPS Hero Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('satisfaction.netPromoterScore', { defaultValue: 'Net Promoter Score' })}
            </p>
            <span className={cn('text-7xl font-extrabold tabular-nums', getNPSColor(overall.nps))}>
              {overall.nps > 0 ? '+' : ''}{overall.nps}
            </span>

            {/* Large gauge */}
            <div className="w-full max-w-md">
              <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full transition-all', getNPSBgColor(overall.nps))}
                  style={{ width: `${Math.max(0, Math.min(100, (overall.nps + 100) / 2))}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">-100</span>
                <span className={cn('text-sm font-semibold', getNPSColor(overall.nps))}>
                  {getNPSLabel(overall.nps)}
                </span>
                <span className="text-xs text-muted-foreground">+100</span>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="w-full max-w-md">
              <div className="flex h-4 w-full rounded-full overflow-hidden">
                {overall.total > 0 && (
                  <>
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${(overall.promoters / overall.total) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-400"
                      style={{ width: `${(overall.passives / overall.total) * 100}%` }}
                    />
                    <div
                      className="bg-destructive"
                      style={{ width: `${(overall.detractors / overall.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 mt-3 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  {t('satisfaction.promoters', { defaultValue: 'Promoters' })} ({overall.promoters})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
                  {t('satisfaction.passives', { defaultValue: 'Passives' })} ({overall.passives})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-destructive" />
                  {t('satisfaction.detractors', { defaultValue: 'Detractors' })} ({overall.detractors})
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('satisfaction.basedOn', { defaultValue: 'Based on {{count}} responses', count: overall.total })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('satisfaction.npsTrend', { defaultValue: 'NPS Trend (12 months)' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartLoader />}>
              <NPSTrendChart ratings={ratings} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('satisfaction.ratingDistribution', { defaultValue: 'Rating Distribution' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartLoader />}>
              <RatingDistributionChart ratings={ratings} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Trigger Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('satisfaction.triggerAnalysis', { defaultValue: 'Satisfaction by Trigger' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ChartLoader />}>
            <TriggerAnalysisChart ratings={ratings} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Recent Ratings Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            {t('satisfaction.recentFeedback', { defaultValue: 'Recent Feedback' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRatings.map((r: SatisfactionRating) => (
              <div
                key={r.id}
                className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">
                      {r.patient_name ?? r.patient_id}
                    </span>
                    <Badge variant={triggerBadgeVariant(r.trigger_type)} className="shrink-0">
                      {TRIGGER_LABELS[r.trigger_type]}
                    </Badge>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(r.created_at)}</p>
                </div>
                <div className="ml-4 shrink-0">
                  <RatingStars rating={r.rating} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
