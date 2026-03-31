import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { motion } from '@/shared/components/motion';
import { BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex flex-col items-center justify-center py-8 text-center', className)}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="text-muted-foreground/40 mb-3"
      >
        {icon || <BarChart3 className="h-8 w-8" />}
      </motion.div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  const heights = [45, 72, 30, 85, 55, 40, 65];
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-end gap-2 h-32">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
            className="flex-1 bg-muted rounded-t-sm animate-pulse"
          />
        ))}
      </div>
      <div className="flex justify-between">
        {heights.map((_, i) => (
          <div key={i} className="h-2 w-6 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function MetricSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex items-center justify-between"
        >
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}
