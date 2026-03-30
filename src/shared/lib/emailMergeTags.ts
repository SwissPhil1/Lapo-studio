import { supabase } from "@/shared/lib/supabase";
import { format, differenceInDays, addDays } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import i18n from '@/i18n';

// Clinic configuration - can be moved to settings table later
const CLINIC_CONFIG = {
  booking_link: "https://lapo.skin/book",
  clinic_phone: "01 23 45 67 89",
  clinic_name: "LAPO Skin"
};

export interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface TreatmentInfo {
  treatment_name: string; // From treatment_protocols.treatment_type
  recall_days: number;    // From treatment_protocols.recall_interval_days
  last_visit_date: Date | null;
  service_name?: string;  // Original service name from booking
  category?: string;      // From treatment_protocols.metadata.category
}

export interface MergeTagData {
  patient: PatientInfo;
  treatment: TreatmentInfo | null;
}

/**
 * Get patient's last treatment information with protocol details
 */
export async function getPatientTreatmentInfo(patientId: string): Promise<TreatmentInfo | null> {
  try {
    // Get last completed booking for this patient
    const { data: lastBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('service, booking_date')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('booking_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bookingError || !lastBooking) {
      console.log('No completed booking found for patient:', patientId);
      return null;
    }

    // Get service mapping for this service
    const { data: serviceMapping, error: mappingError } = await supabase
      .from('service_mappings')
      .select('service_name, treatment_protocol_id')
      .eq('service_name', lastBooking.service)
      .maybeSingle();

    if (mappingError) {
      console.error('Error fetching service mapping:', mappingError);
    }

    // If we have a mapping, fetch the treatment protocol
    if (serviceMapping?.treatment_protocol_id) {
      const { data: protocol, error: protocolError } = await supabase
        .from('treatment_protocols')
        .select('treatment_type, recall_interval_days, metadata')
        .eq('id', serviceMapping.treatment_protocol_id)
        .maybeSingle();

      if (protocolError) {
        console.error('Error fetching treatment protocol:', protocolError);
      }

      if (protocol) {
        const metadata = protocol.metadata as { category?: string } | null;
        return {
          treatment_name: protocol.treatment_type,
          recall_days: protocol.recall_interval_days,
          last_visit_date: new Date(lastBooking.booking_date),
          service_name: lastBooking.service,
          category: metadata?.category
        };
      }
    }

    // Fallback: use service name and default recall (90 days)
    return {
      treatment_name: lastBooking.service,
      recall_days: 90,
      last_visit_date: new Date(lastBooking.booking_date),
      service_name: lastBooking.service
    };
  } catch (error) {
    console.error('Error in getPatientTreatmentInfo:', error);
    return null;
  }
}

/**
 * Calculate days since last visit
 */
function getDaysSinceVisit(lastVisitDate: Date | null): number {
  if (!lastVisitDate) return 0;
  return differenceInDays(new Date(), lastVisitDate);
}

/**
 * Calculate next due date based on last visit and recall interval
 */
function getNextDueDate(lastVisitDate: Date | null, recallDays: number): Date | null {
  if (!lastVisitDate) return null;
  return addDays(lastVisitDate, recallDays);
}

/**
 * Calculate days overdue (negative if not yet due)
 */
function getDaysOverdue(lastVisitDate: Date | null, recallDays: number): number {
  if (!lastVisitDate) return 0;
  const dueDate = addDays(lastVisitDate, recallDays);
  const daysOverdue = differenceInDays(new Date(), dueDate);
  return Math.max(0, daysOverdue);
}

/**
 * Format date with locale-aware formatting
 */
function formatDateLocale(date: Date | null): string {
  if (!date) return '';
  const locale = i18n.language === 'fr' ? frLocale : enUS;
  return format(date, "d MMMM yyyy", { locale });
}

/**
 * Resolve all merge tags in a template string
 */
export function resolveMergeTags(
  template: string,
  data: MergeTagData
): string {
  const { patient, treatment } = data;
  
  let result = template;
  
  // Patient info tags
  result = result.replace(/{first_name}/g, patient.first_name || '');
  result = result.replace(/{last_name}/g, patient.last_name || '');
  result = result.replace(/{email}/g, patient.email || '');
  result = result.replace(/{phone}/g, patient.phone || '');
  
  // Treatment info tags
  if (treatment) {
    result = result.replace(/{treatment_name}/g, treatment.treatment_name || '');
    result = result.replace(/{recall_days}/g, treatment.recall_days?.toString() || '');
    result = result.replace(/{last_visit_date}/g, formatDateLocale(treatment.last_visit_date));
    result = result.replace(/{days_since_visit}/g, getDaysSinceVisit(treatment.last_visit_date).toString());
    
    const nextDueDate = getNextDueDate(treatment.last_visit_date, treatment.recall_days);
    result = result.replace(/{next_due_date}/g, formatDateLocale(nextDueDate));
    result = result.replace(/{days_overdue}/g, getDaysOverdue(treatment.last_visit_date, treatment.recall_days).toString());
  } else {
    // Clear treatment tags if no treatment info
    result = result.replace(/{treatment_name}/g, '');
    result = result.replace(/{recall_days}/g, '');
    result = result.replace(/{last_visit_date}/g, '');
    result = result.replace(/{days_since_visit}/g, '');
    result = result.replace(/{next_due_date}/g, '');
    result = result.replace(/{days_overdue}/g, '');
  }
  
  // Clinic info tags
  result = result.replace(/{booking_link}/g, CLINIC_CONFIG.booking_link);
  result = result.replace(/{clinic_phone}/g, CLINIC_CONFIG.clinic_phone);
  result = result.replace(/{clinic_name}/g, CLINIC_CONFIG.clinic_name);
  
  return result;
}

/**
 * Get the appropriate template category based on treatment category
 */
export function getRecallTemplateKey(treatmentCategory?: string): string {
  if (!treatmentCategory) return 'recall_generic';
  
  const categoryLower = treatmentCategory.toLowerCase();
  
  if (categoryLower.includes('injectable') || categoryLower.includes('botox') || categoryLower.includes('filler')) {
    return 'recall_injectable';
  }
  if (categoryLower.includes('skincare') || categoryLower.includes('facial') || categoryLower.includes('hydra') || categoryLower.includes('led')) {
    return 'recall_skincare';
  }
  if (categoryLower.includes('regenera') || categoryLower.includes('prp') || categoryLower.includes('sculptra')) {
    return 'recall_regenerative';
  }
  if (categoryLower.includes('laser') || categoryLower.includes('tech') || categoryLower.includes('cryo') || categoryLower.includes('needle')) {
    return 'recall_laser';
  }
  
  return 'recall_generic';
}

/**
 * Get template category labels
 */
export function getTemplateCategories(): Record<string, string> {
  return {
    recall: i18n.t('common:templateRecall'),
    reactivation: i18n.t('common:templateReactivation'),
    followup: i18n.t('common:templateFollowup'),
    administrative: i18n.t('common:templateAdministrative'),
    marketing: i18n.t('common:templateMarketing'),
  };
}
