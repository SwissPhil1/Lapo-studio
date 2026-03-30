import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'enroll'
  | 'status_change';

export type AuditEntityType =
  | 'patient'
  | 'booking'
  | 'campaign'
  | 'workflow'
  | 'report'
  | 'segment'
  | 'communication';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

interface LogActionParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: Record<string, unknown>;
}

export function useAuditTrail() {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (params: LogActionParams) => {
      if (!user) return;

      const entry: Omit<AuditLogEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: params.details ?? {},
      };

      try {
        const { error } = await supabase
          .from('audit_logs' as any)
          .insert(entry as any);

        if (error) {
          // Gracefully handle missing table or permission issues
          console.warn('[AuditTrail] Failed to log action:', error.message);
        }
      } catch (err) {
        // Don't crash the UI if audit logging fails
        console.warn('[AuditTrail] Error logging action:', err);
      }
    },
    // Fire-and-forget: don't retry, don't invalidate
    retry: false,
  });

  const logAction = useCallback(
    (
      action: AuditAction,
      entityType: AuditEntityType,
      entityId: string,
      details?: Record<string, unknown>
    ) => {
      mutation.mutate({ action, entityType, entityId, details });
    },
    [mutation]
  );

  return { logAction };
}
