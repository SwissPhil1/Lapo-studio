import { supabase } from './supabase';

/**
 * Fire an outbound webhook (e.g. to Zapier) when a booking is created in-app.
 * The webhook URL can be stored in system_settings or passed directly.
 */
export async function fireBookingWebhook(booking: {
  patient_id: string;
  service: string;
  booking_date: string;
  booking_time?: string;
  notes?: string;
  patient_name?: string;
}) {
  try {
    // Try to fetch webhook URL from system_settings
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'zapier_booking_webhook_url')
      .maybeSingle();

    const webhookUrl = setting?.value || import.meta.env.VITE_ZAPIER_BOOKING_WEBHOOK;
    if (!webhookUrl) return; // No webhook configured, skip silently

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'booking.created',
        data: booking,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Webhook failures should not block the booking creation
  }
}
