import { addDays, differenceInDays } from 'date-fns';
import type { RecallStatus } from '@/modules/crm/components/patients/RecallStatusBadge';

export interface ServiceMapping {
  service_name: string;
  treatment_protocol_id: string | null;
  treatment_protocols?: {
    treatment_type: string;
    recall_interval_days: number;
  } | {
    treatment_type: string;
    recall_interval_days: number;
  }[] | null;
}

export interface TreatmentProtocol {
  treatment_type: string;
  recall_interval_days: number;
}

export interface BookingWithService {
  booking_date: string;
  service?: string;
  status?: string;
}

export interface FollowupContext {
  lastCommunicationDate: Date | null;
  snoozedUntilDate: Date | null;
}

/**
 * Context for display in the recall badge
 */
export interface RecallContext {
  treatmentType: string | null;
  lastTreatmentDate: Date | null;
  recallIntervalDays: number;
  daysSinceTreatment: number | null;
  daysOverdue: number | null;
  recallDueDate: Date | null;
}

const DEFAULT_RECALL_DAYS = 90;
const FOLLOWUP_WINDOW_DAYS = 7;

export function calculateRecallStatus(
  lastTreatmentDate: Date | null,
  recallIntervalDays: number,
  nextBookingDate: Date | null
): RecallStatus {
  if (!lastTreatmentDate) return null;
  
  const today = new Date();
  const nextDueDate = addDays(lastTreatmentDate, recallIntervalDays);
  const daysUntilDue = differenceInDays(nextDueDate, today);
  
  if (nextBookingDate && nextBookingDate > today) {
    return 'scheduled';
  }
  
  if (daysUntilDue > 30) return 'on_track';
  if (daysUntilDue > 0) return 'due_soon';
  return 'overdue';
}

/**
 * Calculate recall status with followup context
 * Returns 'in_followup' if the patient is overdue/due_soon but has recent communication or snoozed task
 */
export function calculateRecallStatusWithFollowup(
  lastTreatmentDate: Date | null,
  recallIntervalDays: number,
  nextBookingDate: Date | null,
  followupContext?: FollowupContext
): RecallStatus {
  const baseStatus = calculateRecallStatus(lastTreatmentDate, recallIntervalDays, nextBookingDate);
  
  // If patient is overdue or due_soon, check if there's active followup
  if ((baseStatus === 'overdue' || baseStatus === 'due_soon') && followupContext) {
    const today = new Date();
    const followupWindowStart = new Date();
    followupWindowStart.setDate(followupWindowStart.getDate() - FOLLOWUP_WINDOW_DAYS);
    
    // Recent communication (within last 7 days)
    if (followupContext.lastCommunicationDate && followupContext.lastCommunicationDate > followupWindowStart) {
      return 'in_followup';
    }
    
    // Task snoozed for future date
    if (followupContext.snoozedUntilDate && followupContext.snoozedUntilDate > today) {
      return 'in_followup';
    }
  }
  
  return baseStatus;
}

/**
 * Get the treatment type for a service by looking up service_mappings first,
 * then falling back to pattern matching against treatment_protocols
 */
export function getTreatmentTypeForService(
  serviceName: string,
  serviceMappings: ServiceMapping[],
  treatmentProtocols: TreatmentProtocol[]
): string | null {
  // 1. Check service_mappings first (exact match)
  const mapping = serviceMappings.find(m => m.service_name === serviceName);
  if (mapping?.treatment_protocols) {
    const protocol = Array.isArray(mapping.treatment_protocols) 
      ? mapping.treatment_protocols[0] 
      : mapping.treatment_protocols;
    if (protocol?.treatment_type) {
      return protocol.treatment_type;
    }
  }

  // 2. Fall back to pattern matching against treatment_protocols
  const lowerService = serviceName.toLowerCase();
  for (const protocol of treatmentProtocols) {
    if (lowerService.includes(protocol.treatment_type.toLowerCase())) {
      return protocol.treatment_type;
    }
  }

  // 3. No match found
  return null;
}

/**
 * Get the recall interval for a service by looking up service_mappings first,
 * then falling back to pattern matching against treatment_protocols
 */
export function getRecallDaysForService(
  serviceName: string,
  serviceMappings: ServiceMapping[],
  treatmentProtocols: TreatmentProtocol[]
): number {
  // 1. Check service_mappings first (exact match)
  const mapping = serviceMappings.find(m => m.service_name === serviceName);
  if (mapping?.treatment_protocols) {
    // Handle both object and array format from Supabase
    const protocol = Array.isArray(mapping.treatment_protocols) 
      ? mapping.treatment_protocols[0] 
      : mapping.treatment_protocols;
    if (protocol?.recall_interval_days) {
      return protocol.recall_interval_days;
    }
  }

  // 2. Fall back to pattern matching against treatment_protocols
  const lowerService = serviceName.toLowerCase();
  for (const protocol of treatmentProtocols) {
    if (lowerService.includes(protocol.treatment_type.toLowerCase())) {
      return protocol.recall_interval_days;
    }
  }

  // 3. Default fallback
  return DEFAULT_RECALL_DAYS;
}

/**
 * Get complete recall context for a patient (for rich badge display)
 */
export function getRecallContext(
  pastBookings: BookingWithService[],
  serviceMappings: ServiceMapping[],
  treatmentProtocols: TreatmentProtocol[]
): RecallContext {
  if (pastBookings.length === 0) {
    return {
      treatmentType: null,
      lastTreatmentDate: null,
      recallIntervalDays: DEFAULT_RECALL_DAYS,
      daysSinceTreatment: null,
      daysOverdue: null,
      recallDueDate: null,
    };
  }

  // Get most recent past booking
  const sortedPast = [...pastBookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );
  const lastBooking = sortedPast[0];
  const lastTreatmentDate = new Date(lastBooking.booking_date);
  const today = new Date();
  
  // Get treatment type and recall interval
  const treatmentType = lastBooking.service 
    ? getTreatmentTypeForService(lastBooking.service, serviceMappings, treatmentProtocols)
    : null;
  
  const recallIntervalDays = lastBooking.service 
    ? getRecallDaysForService(lastBooking.service, serviceMappings, treatmentProtocols)
    : DEFAULT_RECALL_DAYS;
  
  const recallDueDate = addDays(lastTreatmentDate, recallIntervalDays);
  const daysSinceTreatment = differenceInDays(today, lastTreatmentDate);
  const daysOverdue = differenceInDays(today, recallDueDate);
  
  return {
    treatmentType,
    lastTreatmentDate,
    recallIntervalDays,
    daysSinceTreatment,
    daysOverdue: daysOverdue > 0 ? daysOverdue : null,
    recallDueDate,
  };
}

/**
 * Calculate overall recall status for a patient using service mappings
 */
export function getOverallRecallStatusWithMappings(
  pastBookings: BookingWithService[],
  upcomingBookings: BookingWithService[],
  serviceMappings: ServiceMapping[],
  treatmentProtocols: TreatmentProtocol[],
  followupContext?: FollowupContext
): RecallStatus {
  if (pastBookings.length === 0) return null;
  
  // Get most recent past booking
  const sortedPast = [...pastBookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );
  const lastBooking = sortedPast[0];
  const lastTreatmentDate = new Date(lastBooking.booking_date);
  
  // Get recall interval for the service
  const recallDays = lastBooking.service 
    ? getRecallDaysForService(lastBooking.service, serviceMappings, treatmentProtocols)
    : DEFAULT_RECALL_DAYS;
  
  // Get next upcoming booking
  const nextBookingDate = upcomingBookings.length > 0 
    ? new Date(upcomingBookings[0].booking_date) 
    : null;
  
  return calculateRecallStatusWithFollowup(lastTreatmentDate, recallDays, nextBookingDate, followupContext);
}

/**
 * Legacy function for backward compatibility - uses hardcoded default
 * @deprecated Use getOverallRecallStatusWithMappings instead
 */
export function getOverallRecallStatus(
  pastBookings: { booking_date: string }[],
  upcomingBookings: { booking_date: string }[],
  defaultRecallDays: number = DEFAULT_RECALL_DAYS
): RecallStatus {
  if (pastBookings.length === 0) return null;
  
  // Get most recent past booking (for recall calculation)
  const sortedPast = [...pastBookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );
  const lastTreatmentDate = new Date(sortedPast[0].booking_date);
  
  // Get next upcoming booking
  const nextBookingDate = upcomingBookings.length > 0 
    ? new Date(upcomingBookings[0].booking_date) 
    : null;
  
  return calculateRecallStatus(lastTreatmentDate, defaultRecallDays, nextBookingDate);
}

/**
 * Get recall due date for the most recent booking
 */
export function getRecallDueDate(
  pastBookings: BookingWithService[],
  serviceMappings: ServiceMapping[],
  treatmentProtocols: TreatmentProtocol[]
): Date | null {
  if (pastBookings.length === 0) return null;
  
  const sortedPast = [...pastBookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );
  const lastBooking = sortedPast[0];
  const lastTreatmentDate = new Date(lastBooking.booking_date);
  
  const recallDays = lastBooking.service 
    ? getRecallDaysForService(lastBooking.service, serviceMappings, treatmentProtocols)
    : DEFAULT_RECALL_DAYS;
  
  return addDays(lastTreatmentDate, recallDays);
}
