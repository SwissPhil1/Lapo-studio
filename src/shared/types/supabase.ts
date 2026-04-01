export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          details: string
          event_date: string | null
          event_type: string
          id: string
          integration_id: string | null
          metadata: Json | null
          referred_name: string | null
          referrer_code: string | null
          referrer_name: string | null
          updated_at: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details: string
          event_date?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          referred_name?: string | null
          referrer_code?: string | null
          referrer_name?: string | null
          updated_at?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details?: string
          event_date?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          referred_name?: string | null
          referrer_code?: string | null
          referrer_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          ref_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          ref_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          ref_id?: string | null
        }
        Relationships: []
      }
      archive: {
        Row: {
          archived_at: string | null
          booking_date: string | null
          booking_id: string | null
          commission_earned: number | null
          created_at: string | null
          date_first_referred: string | null
          high_value: boolean | null
          id: string
          purchase_count: number | null
          referral_status: string
          referred_email: string
          referred_name: string
          referrer_code: string
          referrer_email: string
          referrer_name: string
          referrer_type: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          booking_date?: string | null
          booking_id?: string | null
          commission_earned?: number | null
          created_at?: string | null
          date_first_referred?: string | null
          high_value?: boolean | null
          id?: string
          purchase_count?: number | null
          referral_status: string
          referred_email: string
          referred_name: string
          referrer_code: string
          referrer_email: string
          referrer_name: string
          referrer_type: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          booking_date?: string | null
          booking_id?: string | null
          commission_earned?: number | null
          created_at?: string | null
          date_first_referred?: string | null
          high_value?: boolean | null
          id?: string
          purchase_count?: number | null
          referral_status?: string
          referred_email?: string
          referred_name?: string
          referrer_code?: string
          referrer_email?: string
          referrer_name?: string
          referrer_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_archive_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_archive_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_archive_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_archive_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      archive_booking_id_errors: {
        Row: {
          archived_at: string | null
          booking_date: string | null
          booking_id: string | null
          commission_earned: number | null
          created_at: string | null
          date_first_referred: string | null
          high_value: boolean | null
          id: string | null
          purchase_count: number | null
          referral_status: string | null
          referred_email: string | null
          referred_name: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_name: string | null
          referrer_type: string | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          booking_date?: string | null
          booking_id?: string | null
          commission_earned?: number | null
          created_at?: string | null
          date_first_referred?: string | null
          high_value?: boolean | null
          id?: string | null
          purchase_count?: number | null
          referral_status?: string | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_code?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_type?: string | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          booking_date?: string | null
          booking_id?: string | null
          commission_earned?: number | null
          created_at?: string | null
          date_first_referred?: string | null
          high_value?: boolean | null
          id?: string | null
          purchase_count?: number | null
          referral_status?: string | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_code?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          admin_email: string | null
          changed_data: Json | null
          id: string
          operation: string
          performed_at: string | null
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          admin_email?: string | null
          changed_data?: Json | null
          id?: string
          operation: string
          performed_at?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          admin_email?: string | null
          changed_data?: Json | null
          id?: string
          operation?: string
          performed_at?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      audit_log_archive: {
        Row: {
          changed_data: Json | null
          id: string
          operation: string
          performed_at: string | null
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          changed_data?: Json | null
          id?: string
          operation: string
          performed_at?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          changed_data?: Json | null
          id?: string
          operation?: string
          performed_at?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      birthday_gift_settings: {
        Row: {
          custom_message: string | null
          enabled: boolean
          expiration_days: number | null
          gift_amount: number
          id: string
          message_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          custom_message?: string | null
          enabled?: boolean
          expiration_days?: number | null
          gift_amount?: number
          id?: string
          message_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          custom_message?: string | null
          enabled?: boolean
          expiration_days?: number | null
          gift_amount?: number
          id?: string
          message_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "birthday_gift_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      booking_mappings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          external_booking_id: string
          id: string
          is_test: boolean
          source: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          external_booking_id: string
          id?: string
          is_test?: boolean
          source: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          external_booking_id?: string
          id?: string
          is_test?: boolean
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_mappings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_mappings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_mappings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "booking_mappings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      booking_notes: {
        Row: {
          booking_id: string
          category: string | null
          created_at: string | null
          id: string
          note: string
        }
        Insert: {
          booking_id: string
          category?: string | null
          created_at?: string | null
          id?: string
          note: string
        }
        Update: {
          booking_id?: string
          category?: string | null
          created_at?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_booking_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_booking_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_value: number
          company_id: string | null
          created_at: string | null
          currency: string | null
          discount_applied: number
          id: string
          initial_service: string | null
          is_test: boolean
          patient_id: string
          profile_id: string | null
          referrer_code: string | null
          rescheduled_to_booking_id: string | null
          service: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_date?: string
          booking_value?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_applied?: number
          id?: string
          initial_service?: string | null
          is_test?: boolean
          patient_id: string
          profile_id?: string | null
          referrer_code?: string | null
          rescheduled_to_booking_id?: string | null
          service: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          booking_value?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_applied?: number
          id?: string
          initial_service?: string | null
          is_test?: boolean
          patient_id?: string
          profile_id?: string | null
          referrer_code?: string | null
          rescheduled_to_booking_id?: string | null
          service?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["referrer_name"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_admin_commission_entries"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_commission_calculation_audit"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referral_patients"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrals_enriched"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_code"]
          },
          {
            foreignKeyName: "bookings_rescheduled_to_booking_id_fkey"
            columns: ["rescheduled_to_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_to_booking_id_fkey"
            columns: ["rescheduled_to_booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_to_booking_id_fkey"
            columns: ["rescheduled_to_booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_to_booking_id_fkey"
            columns: ["rescheduled_to_booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_report_attachments: {
        Row: {
          bug_report_id: string
          created_at: string | null
          file_path: string
          id: string
        }
        Insert: {
          bug_report_id: string
          created_at?: string | null
          file_path: string
          id?: string
        }
        Update: {
          bug_report_id?: string
          created_at?: string | null
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_attachments_bug_report_id_fkey"
            columns: ["bug_report_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          admin_notes: string | null
          browser_info: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          page_url: string | null
          resolved_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          browser_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          browser_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinicminds_notes: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          note: string
          patient_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          note: string
          patient_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          note?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_clinicminds_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clinicminds_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clinicminds_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_clinicminds_notes_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      commission_batch_reversals: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          reason: string | null
          reversed_by: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reversed_by?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reversed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_batch_reversals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_batch_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      commission_batches: {
        Row: {
          batch_number: number
          closed_at: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          processed_by: string | null
          status: string
          total_amount: number | null
          total_commission: number | null
          total_count: number | null
          total_entries: number | null
          total_referrers: number | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: number
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          processed_by?: string | null
          status?: string
          total_amount?: number | null
          total_commission?: number | null
          total_count?: number | null
          total_entries?: number | null
          total_referrers?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: number
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          processed_by?: string | null
          status?: string
          total_amount?: number | null
          total_commission?: number | null
          total_count?: number | null
          total_entries?: number | null
          total_referrers?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_entries: {
        Row: {
          batch_id: string | null
          booking_id: string | null
          commission_amount: number
          commission_batch_id: string | null
          commission_rate: number | null
          converted_lc_amount: number | null
          created_at: string | null
          currency: string
          excluded_from_current_batch: boolean | null
          external_invoice_id: string | null
          id: string
          is_test: boolean
          paid_at: string | null
          patient_id: string | null
          profile_id: string | null
          purchase_amount: number
          purchase_type: string | null
          rate_pct: number | null
          rate_type: string | null
          referrer_id: string | null
          split_parent_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          booking_id?: string | null
          commission_amount: number
          commission_batch_id?: string | null
          commission_rate?: number | null
          converted_lc_amount?: number | null
          created_at?: string | null
          currency?: string
          excluded_from_current_batch?: boolean | null
          external_invoice_id?: string | null
          id?: string
          is_test?: boolean
          paid_at?: string | null
          patient_id?: string | null
          profile_id?: string | null
          purchase_amount: number
          purchase_type?: string | null
          rate_pct?: number | null
          rate_type?: string | null
          referrer_id?: string | null
          split_parent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          booking_id?: string | null
          commission_amount?: number
          commission_batch_id?: string | null
          commission_rate?: number | null
          converted_lc_amount?: number | null
          created_at?: string | null
          currency?: string
          excluded_from_current_batch?: boolean | null
          external_invoice_id?: string | null
          id?: string
          is_test?: boolean
          paid_at?: string | null
          patient_id?: string | null
          profile_id?: string | null
          purchase_amount?: number
          purchase_type?: string | null
          rate_pct?: number | null
          rate_type?: string | null
          referrer_id?: string | null
          split_parent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "commission_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["commission_id"]
          },
          {
            foreignKeyName: "commission_entries_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "v_admin_commission_entries"
            referencedColumns: ["commission_id"]
          },
          {
            foreignKeyName: "commission_entries_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "v_commission_calculation_audit"
            referencedColumns: ["commission_id"]
          },
          {
            foreignKeyName: "commission_entries_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["commission_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      commission_errors: {
        Row: {
          booking_id: string | null
          created_at: string | null
          error_reason: string
          id: string
          referral_id: string | null
          referrer_id: string | null
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          error_reason: string
          id?: string
          referral_id?: string | null
          referrer_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          error_reason?: string
          id?: string
          referral_id?: string | null
          referrer_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referral_patients"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_enriched"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          created_at: string | null
          first_purchase_percent: number
          id: string
          referral_discount_fixed: number | null
          referral_discount_percent: number | null
          referrer_type: string
          repeat_purchase_percent: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_purchase_percent: number
          id?: string
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          referrer_type: string
          repeat_purchase_percent: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_purchase_percent?: number
          id?: string
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          referrer_type?: string
          repeat_purchase_percent?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      communications_log: {
        Row: {
          body: string
          context_data: Json | null
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body: string
          context_data?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          context_data?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          benefit_description: string | null
          contact_email: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          discount_cap: number | null
          discount_rate: number | null
          domain: string | null
          free_treatment_max_count: number | null
          free_treatment_name: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_test: boolean
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          benefit_description?: string | null
          contact_email?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          discount_cap?: number | null
          discount_rate?: number | null
          domain?: string | null
          free_treatment_max_count?: number | null
          free_treatment_name?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_test?: boolean
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          benefit_description?: string | null
          contact_email?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          discount_cap?: number | null
          discount_rate?: number | null
          domain?: string | null
          free_treatment_max_count?: number | null
          free_treatment_name?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_test?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_employees: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_test: boolean
          patient_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_test?: boolean
          patient_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_test?: boolean
          patient_id?: string | null
        }
        Relationships: []
      }
      company_mappings: {
        Row: {
          company_name: string
          created_at: string | null
          custom_commission_first: number | null
          custom_commission_repeat: number | null
          domain: string
          id: string
          referrer_type_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          custom_commission_first?: number | null
          custom_commission_repeat?: number | null
          domain: string
          id?: string
          referrer_type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          custom_commission_first?: number | null
          custom_commission_repeat?: number | null
          domain?: string
          id?: string
          referrer_type_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_automation_settings: {
        Row: {
          active: boolean | null
          channel: string | null
          created_at: string | null
          delay_days: number | null
          delay_months: number | null
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          channel?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_months?: number | null
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          channel?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_months?: number | null
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_booking_links: {
        Row: {
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          message: string | null
          patient_id: string | null
          token: string
          treatment_type: string | null
          used_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          patient_id?: string | null
          token: string
          treatment_type?: string | null
          used_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          patient_id?: string | null
          token?: string
          treatment_type?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_booking_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_booking_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_booking_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "crm_booking_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "crm_booking_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "crm_booking_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "crm_booking_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_booking_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          channel: string
          created_at: string
          id: string
          message_template: string
          name: string
          scheduled_at: string | null
          segment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message_template: string
          name: string
          scheduled_at?: string | null
          segment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message_template?: string
          name?: string
          scheduled_at?: string | null
          segment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_campaigns_segment"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_communication_logs: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          clicked_count: number | null
          created_at: string
          delivered_at: string | null
          direction: string | null
          follow_up_date: string | null
          full_message: string | null
          id: string
          message_preview: string | null
          opened_at: string | null
          opened_count: number | null
          patient_id: string
          resend_email_id: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          channel: string
          clicked_at?: string | null
          clicked_count?: number | null
          created_at?: string
          delivered_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          full_message?: string | null
          id?: string
          message_preview?: string | null
          opened_at?: string | null
          opened_count?: number | null
          patient_id: string
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          clicked_count?: number | null
          created_at?: string
          delivered_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          full_message?: string | null
          id?: string
          message_preview?: string | null
          opened_at?: string | null
          opened_count?: number | null
          patient_id?: string
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_communication_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_communication_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_communication_logs_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_crm_communication_logs_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_crm_communication_logs_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_communication_logs_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean | null
          note_type: string
          priority: string
          tags: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          priority?: string
          tags?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          priority?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_segments: {
        Row: {
          ai_query: string | null
          created_at: string
          filter_json: Json | null
          id: string
          name: string
          patient_ids: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          ai_query?: string | null
          created_at?: string
          filter_json?: Json | null
          id?: string
          name: string
          patient_ids?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          ai_query?: string | null
          created_at?: string
          filter_json?: Json | null
          id?: string
          name?: string
          patient_ids?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_workflow_enrollments: {
        Row: {
          completed_at: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          metadata: Json | null
          next_action_at: string | null
          patient_id: string
          status: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_action_at?: string | null
          patient_id: string
          status?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_action_at?: string | null
          patient_id?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "crm_workflow_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "crm_workflow_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_enrollments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_steps: {
        Row: {
          action_type: string
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          message_override: string | null
          step_order: number
          subject_override: string | null
          template_id: string | null
          workflow_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          message_override?: string | null
          step_order: number
          subject_override?: string | null
          template_id?: string | null
          workflow_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          message_override?: string | null
          step_order?: number
          subject_override?: string | null
          template_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          last_viewed_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_log: {
        Row: {
          clinicminds_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          invoice_number: string | null
          matched_referral_id: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          referrer_code: string | null
          source_function: string
          stage: string
          trace_id: string
        }
        Insert: {
          clinicminds_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          invoice_number?: string | null
          matched_referral_id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          referrer_code?: string | null
          source_function: string
          stage: string
          trace_id: string
        }
        Update: {
          clinicminds_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          invoice_number?: string | null
          matched_referral_id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          referrer_code?: string | null
          source_function?: string
          stage?: string
          trace_id?: string
        }
        Relationships: []
      }
      debug_signup_logs: {
        Row: {
          created_at: string
          details: Json | null
          error_code: string | null
          id: string
          message: string
          step: string
          success: boolean | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          error_code?: string | null
          id?: string
          message: string
          step: string
          success?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          error_code?: string | null
          id?: string
          message?: string
          step?: string
          success?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          id: string
          is_system: boolean | null
          key: string
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          key: string
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          key?: string
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      errors_log: {
        Row: {
          created_at: string | null
          data_payload: Json | null
          error_date: string | null
          error_message: string
          id: string
          referrer_code: string | null
          referrer_email: string | null
          referrer_name: string | null
          referrer_phone: string | null
          updated_at: string | null
          zap_name: string | null
        }
        Insert: {
          created_at?: string | null
          data_payload?: Json | null
          error_date?: string | null
          error_message: string
          id?: string
          referrer_code?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_phone?: string | null
          updated_at?: string | null
          zap_name?: string | null
        }
        Update: {
          created_at?: string | null
          data_payload?: Json | null
          error_date?: string | null
          error_message?: string
          id?: string
          referrer_code?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_phone?: string | null
          updated_at?: string | null
          zap_name?: string | null
        }
        Relationships: []
      }
      identity_provisioning_queue: {
        Row: {
          attempts: number
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_error: string | null
          last_name: string | null
          max_attempts: number
          patient_id: string
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_error?: string | null
          last_name?: string | null
          max_attempts?: number
          patient_id: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_error?: string | null
          last_name?: string | null
          max_attempts?: number
          patient_id?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_provisioning_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "identity_provisioning_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "identity_provisioning_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_provisioning_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_resolution: {
        Row: {
          conflict_type: string
          created_at: string | null
          details: Json | null
          email: string
          id: string
          patient_id: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          conflict_type: string
          created_at?: string | null
          details?: Json | null
          email: string
          id?: string
          patient_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          conflict_type?: string
          created_at?: string | null
          details?: Json | null
          email?: string
          id?: string
          patient_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_resolution_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "identity_resolution_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "identity_resolution_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_resolution_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_rules: {
        Row: {
          active: boolean
          commission_threshold: number | null
          created_at: string | null
          id: string
          milestone_type: string | null
          referrer_type: string
          reward_description_en: string
          reward_description_fr: string
          reward_type: string | null
          reward_value: number | null
          threshold: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          commission_threshold?: number | null
          created_at?: string | null
          id?: string
          milestone_type?: string | null
          referrer_type: string
          reward_description_en: string
          reward_description_fr: string
          reward_type?: string | null
          reward_value?: number | null
          threshold: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          commission_threshold?: number | null
          created_at?: string | null
          id?: string
          milestone_type?: string | null
          referrer_type?: string
          reward_description_en?: string
          reward_description_fr?: string
          reward_type?: string | null
          reward_value?: number | null
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          discount: number | null
          id: string
          net_amount: number | null
          status: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          net_amount?: number | null
          status?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          net_amount?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      lapo_cash_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          performed_by: string | null
          reference_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          performed_by?: string | null
          reference_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          performed_by?: string | null
          reference_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lapo_cash_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "lapo_cash_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      lapo_cash_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          patient_id: string
          referrer_id: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          patient_id: string
          referrer_id?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          patient_id?: string
          referrer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "lapo_cash_wallets_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_key: string
          template_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_key: string
          template_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_key?: string
          template_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          message: string
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          message: string
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          message?: string
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          category: string | null
          created_at: string
          delivery_status: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          read_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outgoing_webhooks: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          retry_count: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          payload: Json
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          retry_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      outgoing_webhooks_archive: {
        Row: {
          archived_at: string
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          retry_count: number
          status: string
        }
        Insert: {
          archived_at?: string
          created_at?: string
          event_type: string
          id: string
          last_error?: string | null
          payload: Json
          retry_count?: number
          status?: string
        }
        Update: {
          archived_at?: string
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
      patient_treatments: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          patient_id: string
          provider_id: string | null
          treatment_type: string
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          patient_id: string
          provider_id?: string | null
          treatment_type: string
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          patient_id?: string
          provider_id?: string | null
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "patient_treatments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          consents: Json | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          id: string
          is_business_contact: boolean | null
          is_test: boolean
          last_name: string
          normalized_email: string | null
          normalized_phone: string | null
          phone: string | null
          postal_code: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          consents?: Json | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_business_contact?: boolean | null
          is_test?: boolean
          last_name: string
          normalized_email?: string | null
          normalized_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          consents?: Json | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_business_contact?: boolean | null
          is_test?: boolean
          last_name?: string
          normalized_email?: string | null
          normalized_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payout_exports: {
        Row: {
          batch_id: string
          created_at: string | null
          created_by: string | null
          file_name: string
          id: string
          status: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          created_by?: string | null
          file_name: string
          id?: string
          status?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_exports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_exports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "payout_exports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "payout_exports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      payout_profiles: {
        Row: {
          address: string | null
          bank_name: string | null
          created_at: string | null
          iban: string | null
          id: string
          phone: string | null
          referrer_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          phone?: string | null
          referrer_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          phone?: string | null
          referrer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "payout_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          notes: string | null
          payout_date: string | null
          payout_method: string | null
          payout_reference: string | null
          processed_by: string | null
          referrer_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payout_date?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          processed_by?: string | null
          referrer_id: string
          status: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payout_date?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          processed_by?: string | null
          referrer_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_patients: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          entered_at: string | null
          id: string
          notes: string | null
          patient_id: string
          priority: number | null
          stage_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: number | null
          stage_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: number | null
          stage_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_patients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "pipeline_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "pipeline_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_patients_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      processed_invoices: {
        Row: {
          applied_discount_rate: number | null
          booking_id: string | null
          chf_amount: number
          created_at: string | null
          currency: string
          discount_chf: number | null
          estimated_discount_amount: number | null
          id: string
          invoice_number: string
          is_test: boolean
          net_amount: number | null
          paid_at: string | null
          patient_id: string | null
          referrer_code: string | null
          referrer_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          applied_discount_rate?: number | null
          booking_id?: string | null
          chf_amount: number
          created_at?: string | null
          currency?: string
          discount_chf?: number | null
          estimated_discount_amount?: number | null
          id?: string
          invoice_number: string
          is_test?: boolean
          net_amount?: number | null
          paid_at?: string | null
          patient_id?: string | null
          referrer_code?: string | null
          referrer_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          applied_discount_rate?: number | null
          booking_id?: string | null
          chf_amount?: number
          created_at?: string | null
          currency?: string
          discount_chf?: number | null
          estimated_discount_amount?: number | null
          id?: string
          invoice_number?: string
          is_test?: boolean
          net_amount?: number | null
          paid_at?: string | null
          patient_id?: string | null
          referrer_code?: string | null
          referrer_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_processed_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_processed_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_processed_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_processed_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          address: string | null
          auth_user_id: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          has_auth_account: boolean | null
          iban: string | null
          id: string
          is_referrer: boolean | null
          last_name: string | null
          migration_phase: string | null
          normalized_email: string | null
          normalized_phone: string | null
          notifications_enabled: boolean | null
          original_acquisition_source: string | null
          phone: string | null
          profile_origin: string | null
          referred_by: string | null
          referrer_category_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          auth_user_id?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          has_auth_account?: boolean | null
          iban?: string | null
          id: string
          is_referrer?: boolean | null
          last_name?: string | null
          migration_phase?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notifications_enabled?: boolean | null
          original_acquisition_source?: string | null
          phone?: string | null
          profile_origin?: string | null
          referred_by?: string | null
          referrer_category_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          account_status?: string
          address?: string | null
          auth_user_id?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          has_auth_account?: boolean | null
          iban?: string | null
          id?: string
          is_referrer?: boolean | null
          last_name?: string | null
          migration_phase?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notifications_enabled?: boolean | null
          original_acquisition_source?: string | null
          phone?: string | null
          profile_origin?: string | null
          referred_by?: string | null
          referrer_category_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_category_id_fkey"
            columns: ["referrer_category_id"]
            isOneToOne: false
            referencedRelation: "referrer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reactivation_tasks: {
        Row: {
          assigned_to: string | null
          attempt_count: number
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          last_attempt_at: string | null
          metadata: Json | null
          next_attempt_at: string | null
          notes: string | null
          outcome: string | null
          patient_id: string
          priority: string
          snoozed_until: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attempt_count?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          next_attempt_at?: string | null
          notes?: string | null
          outcome?: string | null
          patient_id: string
          priority?: string
          snoozed_until?: string | null
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attempt_count?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          next_attempt_at?: string | null
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          priority?: string
          snoozed_until?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactivation_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "reactivation_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "reactivation_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          patient_discount_first: number
          patient_discount_repeat: number
          referrer_commission_first: number
          referrer_commission_repeat: number
          referrer_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          patient_discount_first?: number
          patient_discount_repeat?: number
          referrer_commission_first?: number
          referrer_commission_repeat?: number
          referrer_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          patient_discount_first?: number
          patient_discount_repeat?: number
          referrer_commission_first?: number
          referrer_commission_repeat?: number
          referrer_type_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          booking_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_test: boolean
          origin_type: string | null
          referral_discount_fixed: number | null
          referral_discount_percent: number | null
          referral_status: string | null
          referred_patient_id: string
          referred_profile_id: string | null
          referrer_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_test?: boolean
          origin_type?: string | null
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          referral_status?: string | null
          referred_patient_id: string
          referred_profile_id?: string | null
          referrer_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_test?: boolean
          origin_type?: string | null
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          referral_status?: string | null
          referred_patient_id?: string
          referred_profile_id?: string | null
          referrer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      referrer_categories: {
        Row: {
          commission_first_pct: number
          commission_repeat_pct: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          milestone_threshold: number | null
          milestone_type: string | null
          name: string
          reward_description_en: string | null
          reward_description_fr: string | null
          reward_type: string | null
          reward_value: number | null
          updated_at: string | null
        }
        Insert: {
          commission_first_pct?: number
          commission_repeat_pct?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          milestone_threshold?: number | null
          milestone_type?: string | null
          name: string
          reward_description_en?: string | null
          reward_description_fr?: string | null
          reward_type?: string | null
          reward_value?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_first_pct?: number
          commission_repeat_pct?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          milestone_threshold?: number | null
          milestone_type?: string | null
          name?: string
          reward_description_en?: string | null
          reward_description_fr?: string | null
          reward_type?: string | null
          reward_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrer_celebrations_seen: {
        Row: {
          celebration_type: string
          id: string
          referrer_id: string
          seen_at: string
          year: number | null
        }
        Insert: {
          celebration_type: string
          id?: string
          referrer_id: string
          seen_at?: string
          year?: number | null
        }
        Update: {
          celebration_type?: string
          id?: string
          referrer_id?: string
          seen_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_celebrations_seen_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      referrer_milestone_rewards: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          milestone_threshold: number
          milestone_type: string
          reward_description_en: string
          reward_description_fr: string
          reward_type: string
          reward_value: number
          tier_name: string
          tier_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_threshold?: number
          milestone_type?: string
          reward_description_en: string
          reward_description_fr: string
          reward_type: string
          reward_value?: number
          tier_name: string
          tier_order: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_threshold?: number
          milestone_type?: string
          reward_description_en?: string
          reward_description_fr?: string
          reward_type?: string
          reward_value?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrer_milestone_rewards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "referrer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referrer_notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          email_message_id: string | null
          id: string
          metadata: Json
          read_at: string | null
          referrer_id: string
          sent_email_at: string | null
          title: string
          type: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          email_message_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          referrer_id: string
          sent_email_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          email_message_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          referrer_id?: string
          sent_email_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrer_notifications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      referrer_type_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_first_purchase: number | null
          new_repeat_purchase: number | null
          old_first_purchase: number | null
          old_repeat_purchase: number | null
          referrer_type_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_first_purchase?: number | null
          new_repeat_purchase?: number | null
          old_first_purchase?: number | null
          old_repeat_purchase?: number | null
          referrer_type_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_first_purchase?: number | null
          new_repeat_purchase?: number | null
          old_first_purchase?: number | null
          old_repeat_purchase?: number | null
          referrer_type_id?: string
        }
        Relationships: []
      }
      referrer_types: {
        Row: {
          code: string
          created_at: string | null
          default_commission_rate: number | null
          description: string | null
          display_order: number | null
          first_purchase_rate: number
          id: string
          is_active: boolean
          is_default: boolean
          lapo_cash_conversion_rate: number | null
          name: string
          referral_discount_fixed: number | null
          referral_discount_percent: number | null
          repeat_purchase_rate: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_commission_rate?: number | null
          description?: string | null
          display_order?: number | null
          first_purchase_rate?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          lapo_cash_conversion_rate?: number | null
          name: string
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          repeat_purchase_rate?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_commission_rate?: number | null
          description?: string | null
          display_order?: number | null
          first_purchase_rate?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          lapo_cash_conversion_rate?: number | null
          name?: string
          referral_discount_fixed?: number | null
          referral_discount_percent?: number | null
          repeat_purchase_rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      referrers: {
        Row: {
          address: string | null
          auto_payout_enabled: boolean | null
          auto_payout_paused_at: string | null
          bank_address: string | null
          bank_name: string | null
          birth_date: string | null
          commission_rate: number | null
          company_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_notifications_enabled: boolean
          iban: string | null
          id: string
          is_test: boolean
          last_seen_tier_id: string | null
          patient_id: string | null
          phone_number: string | null
          preferred_payout_method: string | null
          profile_id: string | null
          referrer_code: string
          referrer_type_id: string
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auto_payout_enabled?: boolean | null
          auto_payout_paused_at?: string | null
          bank_address?: string | null
          bank_name?: string | null
          birth_date?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean
          iban?: string | null
          id?: string
          is_test?: boolean
          last_seen_tier_id?: string | null
          patient_id?: string | null
          phone_number?: string | null
          preferred_payout_method?: string | null
          profile_id?: string | null
          referrer_code: string
          referrer_type_id: string
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auto_payout_enabled?: boolean | null
          auto_payout_paused_at?: string | null
          bank_address?: string | null
          bank_name?: string | null
          birth_date?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean
          iban?: string | null
          id?: string
          is_test?: boolean
          last_seen_tier_id?: string | null
          patient_id?: string | null
          phone_number?: string | null
          preferred_payout_method?: string | null
          profile_id?: string | null
          referrer_code?: string
          referrer_type_id?: string
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrers_patient_id"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrers_patient_id"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrers_patient_id"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrers_patient_id"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_last_seen_tier_id_fkey"
            columns: ["last_seen_tier_id"]
            isOneToOne: false
            referencedRelation: "referrer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_referrer_type_id_fkey"
            columns: ["referrer_type_id"]
            isOneToOne: false
            referencedRelation: "referrer_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          priority: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_log: {
        Row: {
          confirmed_count: number
          created_at: string | null
          date_awarded: string | null
          event_source: string | null
          id: string
          referrer_code: string
          referrer_email: string
          referrer_name: string
          referrer_type: string
          reward_description_en: string
          reward_description_fr: string
          threshold_met: number
          updated_at: string | null
        }
        Insert: {
          confirmed_count: number
          created_at?: string | null
          date_awarded?: string | null
          event_source?: string | null
          id?: string
          referrer_code: string
          referrer_email: string
          referrer_name: string
          referrer_type: string
          reward_description_en: string
          reward_description_fr: string
          threshold_met: number
          updated_at?: string | null
        }
        Update: {
          confirmed_count?: number
          created_at?: string | null
          date_awarded?: string | null
          event_source?: string | null
          id?: string
          referrer_code?: string
          referrer_email?: string
          referrer_name?: string
          referrer_type?: string
          reward_description_en?: string
          reward_description_fr?: string
          threshold_met?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      service_mappings: {
        Row: {
          created_at: string | null
          id: string
          is_auto_matched: boolean | null
          service_name: string
          treatment_protocol_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_auto_matched?: boolean | null
          service_name: string
          treatment_protocol_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_auto_matched?: boolean | null
          service_name?: string
          treatment_protocol_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_mappings_treatment_protocol_id_fkey"
            columns: ["treatment_protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          setting_name: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      test_audit_log: {
        Row: {
          action: string
          admin_email: string
          batch_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          payload: Json | null
        }
        Insert: {
          action: string
          admin_email: string
          batch_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
        }
        Update: {
          action?: string
          admin_email?: string
          batch_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
      tier_upgrade_thresholds: {
        Row: {
          commission_threshold: number
          created_at: string | null
          from_tier_id: string | null
          id: string
          to_tier_id: string
          updated_at: string | null
        }
        Insert: {
          commission_threshold: number
          created_at?: string | null
          from_tier_id?: string | null
          id?: string
          to_tier_id: string
          updated_at?: string | null
        }
        Update: {
          commission_threshold?: number
          created_at?: string | null
          from_tier_id?: string | null
          id?: string
          to_tier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_upgrade_thresholds_from_tier_id_fkey"
            columns: ["from_tier_id"]
            isOneToOne: false
            referencedRelation: "referrer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_upgrade_thresholds_to_tier_id_fkey"
            columns: ["to_tier_id"]
            isOneToOne: false
            referencedRelation: "referrer_types"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_protocols: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          recall_interval_days: number
          treatment_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recall_interval_days: number
          treatment_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recall_interval_days?: number
          treatment_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          assigned_on: string | null
          created_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_on?: string | null
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_on?: string | null
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_referrer_milestones: {
        Row: {
          email: string | null
          milestone_id: string | null
          progress: number | null
          referrer_id: string | null
          reward_en: string | null
          reward_fr: string | null
          reward_type: string | null
          reward_value: number | null
          threshold: number | null
        }
        Relationships: []
      }
      admin_users_unified: {
        Row: {
          account_status: string | null
          acquisition_badge: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_referral: boolean | null
          is_referrer: boolean | null
          last_name: string | null
          phone: string | null
          record_origin: string | null
          referral_status: string | null
          referred_by: string | null
          referred_by_name: string | null
          referrer_category_id: string | null
          referrer_category_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_category_id_fkey"
            columns: ["referrer_category_id"]
            isOneToOne: false
            referencedRelation: "referrer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users_with_referrals: {
        Row: {
          account_status: string | null
          acquisition_badge: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_referral: boolean | null
          is_referrer: boolean | null
          last_name: string | null
          phone: string | null
          record_origin: string | null
          referral_status: string | null
          referred_by: string | null
          referred_by_name: string | null
          referrer_category_id: string | null
          referrer_category_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_category_id_fkey"
            columns: ["referrer_category_id"]
            isOneToOne: false
            referencedRelation: "referrer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_overview: {
        Row: {
          batch_created: string | null
          batch_id: string | null
          batch_notes: string | null
          booking_id: string | null
          commission_amount: number | null
          commission_id: string | null
          commission_rate: number | null
          created_at: string | null
          paid_at: string | null
          purchase_amount: number | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_name: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      company_analytics_enhanced: {
        Row: {
          active: boolean | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          discount_rate: number | null
          domain: string | null
          employee_count: number | null
          last_activity_at: string | null
          net_revenue: number | null
          total_discounts: number | null
          total_referrals: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      company_analytics_view: {
        Row: {
          company_id: string | null
          company_name: string | null
          discount_rate: number | null
          domain: string | null
          latest_activity: string | null
          total_commission_amount: number | null
          total_commissions: number | null
          total_discounts: number | null
          total_employees: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      crm_appointments_today_view: {
        Row: {
          duration_minutes: number | null
          id: string | null
          patient_first_name: string | null
          patient_id: string | null
          patient_last_name: string | null
          start_time: string | null
          status: string | null
          treatment_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_inactive_patients_6m_view: {
        Row: {
          email: string | null
          first_name: string | null
          last_name: string | null
          last_visit_at: string | null
          months_inactive: number | null
          patient_id: string | null
          phone: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          last_visit_at?: never
          months_inactive?: never
          patient_id?: string | null
          phone?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          last_visit_at?: never
          months_inactive?: never
          patient_id?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      crm_patient_overview_view: {
        Row: {
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          first_visit_at: string | null
          gender: string | null
          is_inactive_6m: boolean | null
          is_vip: boolean | null
          last_name: string | null
          last_visit_at: string | null
          lifetime_revenue: number | null
          patient_id: string | null
          phone: string | null
          tags: Json | null
          total_visits: number | null
        }
        Insert: {
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          first_visit_at?: string | null
          gender?: string | null
          is_inactive_6m?: never
          is_vip?: never
          last_name?: string | null
          last_visit_at?: never
          lifetime_revenue?: never
          patient_id?: string | null
          phone?: string | null
          tags?: Json | null
          total_visits?: never
        }
        Update: {
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          first_visit_at?: string | null
          gender?: string | null
          is_inactive_6m?: never
          is_vip?: never
          last_name?: string | null
          last_visit_at?: never
          lifetime_revenue?: never
          patient_id?: string | null
          phone?: string | null
          tags?: Json | null
          total_visits?: never
        }
        Relationships: []
      }
      crm_patient_timeline_view: {
        Row: {
          amount: number | null
          event_date: string | null
          event_id: string | null
          event_type: string | null
          patient_id: string | null
          status: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          amount?: number | null
          event_date?: string | null
          event_id?: string | null
          event_type?: never
          patient_id?: string | null
          status?: string | null
          subtitle?: never
          title?: string | null
        }
        Update: {
          amount?: number | null
          event_date?: string | null
          event_id?: string | null
          event_type?: never
          patient_id?: string | null
          status?: string | null
          subtitle?: never
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_segments_overview_view: {
        Row: {
          description: string | null
          name: string | null
          notes: string | null
          patient_count: number | null
          segment_key: string | null
          type: string | null
        }
        Relationships: []
      }
      crm_today_kpis_view: {
        Row: {
          avg_revenue_per_patient_30d: number | null
          date: string | null
          new_patients_this_week: number | null
          patients_today: number | null
          revenue_today: number | null
          treatments_today: number | null
        }
        Relationships: []
      }
      crm_unpaid_invoices_view: {
        Row: {
          age_days: number | null
          amount_due: number | null
          due_date: string | null
          invoice_id: string | null
          patient_first_name: string | null
          patient_id: string | null
          patient_last_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_users_enhanced: {
        Row: {
          account_status: string | null
          company_id: string | null
          company_name: string | null
          confirmed_referrals: number | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_referral: boolean | null
          is_referrer: boolean | null
          last_activity_date: string | null
          last_name: string | null
          last_note_date: string | null
          phone: string | null
          referral_status: string | null
          referrer_category_id: string | null
          referrer_category_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_activities: number | null
          total_commissions: number | null
          total_notes: number | null
          total_referrals: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_category_id_fkey"
            columns: ["referrer_category_id"]
            isOneToOne: false
            referencedRelation: "referrer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_users_enhanced_plus: {
        Row: {
          account_status: string | null
          company_id: string | null
          company_name: string | null
          confirmed_referrals: number | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_referral: boolean | null
          is_referrer: boolean | null
          last_activity_date: string | null
          last_name: string | null
          last_note_date: string | null
          phone: string | null
          provisioning_status: string | null
          record_origin: string | null
          referral_status: string | null
          referrer_category_id: string | null
          referrer_category_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_activities: number | null
          total_commissions: number | null
          total_notes: number | null
          total_referrals: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      dashboard_commission_batches: {
        Row: {
          batch_id: string | null
          created_at: string | null
          notes: string | null
          status: string | null
          total_amount: number | null
          total_count: number | null
          total_paid: number | null
          total_referrers: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      dashboard_commission_errors: {
        Row: {
          booking_id: string | null
          created_at: string | null
          error_id: string | null
          error_reason: string | null
          referral_id: string | null
          referrer_id: string | null
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          error_id?: string | null
          error_reason?: string | null
          referral_id?: string | null
          referrer_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          error_id?: string | null
          error_reason?: string | null
          referral_id?: string | null
          referrer_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "commission_errors_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referral_patients"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_enriched"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "commission_errors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      dashboard_meta: {
        Row: {
          total_booking_value: number | null
          total_commissions: number | null
          total_discounts: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
          total_revenue_from_companies: number | null
          total_revenue_from_referrals: number | null
        }
        Relationships: []
      }
      dashboard_time_series: {
        Row: {
          commission_amount: number | null
          day: string | null
          new_commissions: number | null
          new_referrers: number | null
          revenue: number | null
        }
        Relationships: []
      }
      identity_provisioning_queue_stats: {
        Row: {
          cnt: number | null
          oldest: string | null
          status: string | null
        }
        Relationships: []
      }
      migration_progress: {
        Row: {
          legacy: number | null
          migrated: number | null
          percent_complete: number | null
          table_name: string | null
          total: number | null
        }
        Relationships: []
      }
      patient_treatment_summary: {
        Row: {
          last_treatment_date: string | null
          next_due_date: string | null
          patient_id: string | null
          recall_interval_days: number | null
          recall_status: string | null
          total_spent: number | null
          treatment_count: number | null
          treatment_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients_compat: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients_without_profiles: {
        Row: {
          consents: Json | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          consents?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          consents?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrer_summary: {
        Row: {
          booked_referrals: number | null
          company_id: string | null
          confirmed_referrals: number | null
          effective_commission_rate: number | null
          email: string | null
          latest_commission_at: string | null
          latest_referral_at: string | null
          pending_referrals: number | null
          referrer_code: string | null
          referrer_id: string | null
          referrer_type: string | null
          status: string | null
          total_commissions: number | null
          total_commissions_paid: number | null
          total_commissions_pending: number | null
          total_patients: number | null
          total_referrals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_enhanced"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_analytics_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_referral_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_company_revenue"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrals_with_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "referrers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["company_id"]
          },
        ]
      }
      system_health: {
        Row: {
          commission_errors: number | null
          paid_commissions: number | null
          pending_commissions: number | null
          total_batches: number | null
          total_bookings: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
        }
        Relationships: []
      }
      v_admin_commission_entries: {
        Row: {
          batch_id: string | null
          booking_id: string | null
          commission_amount: number | null
          commission_batch_id: string | null
          commission_id: string | null
          commission_rate: number | null
          created_at: string | null
          currency: string | null
          paid_at: string | null
          purchase_amount: number | null
          rate_pct: number | null
          rate_type: string | null
          referred_email: string | null
          referred_first_name: string | null
          referred_last_name: string | null
          referred_profile_id: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "commission_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "commission_overview"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "dashboard_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_commission_batch_id_fkey"
            columns: ["commission_batch_id"]
            isOneToOne: false
            referencedRelation: "v_commission_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "admin_users_with_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "crm_users_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "patients_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      v_admin_dashboard_summary: {
        Row: {
          top_company_commissions: number | null
          top_company_id: string | null
          top_company_name: string | null
          top_company_referrals: number | null
          top_referrer_commissions: number | null
          top_referrer_email: string | null
          top_referrer_id: string | null
          top_referrer_referrals: number | null
          total_bookings: number | null
          total_commission_amount: number | null
          total_commissions: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
        }
        Relationships: []
      }
      v_commission_audit: {
        Row: {
          commission_diff: number | null
          commission_entry_count: number | null
          has_commission_discrepancy: boolean | null
          has_referral_discrepancy: boolean | null
          real_paid_commissions: number | null
          real_pending_commissions: number | null
          real_referral_count: number | null
          real_total_commissions: number | null
          referral_diff: number | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          view_total_commissions: number | null
        }
        Relationships: []
      }
      v_commission_batches: {
        Row: {
          batch_id: string | null
          created_at: string | null
          entries_count: number | null
          first_paid: string | null
          last_paid: string | null
          notes: string | null
          processed_by: string | null
          processed_by_email: string | null
          processed_by_name: string | null
          total_commission: number | null
        }
        Relationships: []
      }
      v_commission_calculation_audit: {
        Row: {
          calculated_amount: number | null
          calculated_rate: number | null
          commission_id: string | null
          created_at: string | null
          expected_amount: number | null
          expected_rate: number | null
          is_test: boolean | null
          patient_id: string | null
          purchase_amount: number | null
          purchase_type: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          referrer_type_code: string | null
          referrer_type_name: string | null
          status: string | null
          type_first_rate: number | null
          type_repeat_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_commission_entries_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      v_commission_overview: {
        Row: {
          commission_amount: number | null
          commission_created_at: string | null
          commission_id: string | null
          commission_status: string | null
          company_id: string | null
          company_name: string | null
          paid_at: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
        }
        Relationships: []
      }
      v_commission_status_summary: {
        Row: {
          first_commission: string | null
          grand_total: number | null
          last_update: string | null
          paid_count: number | null
          paid_total: number | null
          pending_count: number | null
          pending_total: number | null
        }
        Relationships: []
      }
      v_company_referral_stats: {
        Row: {
          company_domain: string | null
          company_id: string | null
          company_name: string | null
          total_commissions: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
        }
        Relationships: []
      }
      v_dashboard_app_revenue: {
        Row: {
          revenue: number | null
          timeframe: string | null
        }
        Relationships: []
      }
      v_dashboard_commission: {
        Row: {
          batched_commission: number | null
          paid_commission: number | null
          pending_commission: number | null
          total_commission: number | null
        }
        Relationships: []
      }
      v_dashboard_commission_weekly: {
        Row: {
          total_commission: number | null
          week: string | null
        }
        Relationships: []
      }
      v_dashboard_company_revenue: {
        Row: {
          company_id: string | null
          company_name: string | null
          total_bookings: number | null
          total_discounts: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_dashboard_kpis: {
        Row: {
          total_booking_value: number | null
          total_commissions: number | null
          total_discounts: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
        }
        Relationships: []
      }
      v_dashboard_new_referrals_daily: {
        Row: {
          day: string | null
          new_referrals: number | null
        }
        Relationships: []
      }
      v_dashboard_new_referrers_daily: {
        Row: {
          day: string | null
          new_referrers: number | null
        }
        Relationships: []
      }
      v_dashboard_patient_growth: {
        Row: {
          month: string | null
          new_patients: number | null
        }
        Relationships: []
      }
      v_dashboard_referrals_daily: {
        Row: {
          day: string | null
          referrals: number | null
        }
        Relationships: []
      }
      v_meta_dashboard: {
        Row: {
          total_booking_value: number | null
          total_commissions: number | null
          total_discounts: number | null
          total_patients: number | null
          total_referrals: number | null
          total_referrers: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_referral_patients: {
        Row: {
          created_at: string | null
          patient_name: string | null
          referral_id: string | null
          referral_status: string | null
          referred_patient_id: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      v_referrals_enriched: {
        Row: {
          booking_date: string | null
          booking_id: string | null
          booking_value: number | null
          consultation_number: number | null
          created_at: string | null
          expires_at: string | null
          is_test: boolean | null
          referral_id: string | null
          referral_status: string | null
          referred_email: string | null
          referred_first_name: string | null
          referred_last_name: string | null
          referred_patient_id: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_first_name: string | null
          referrer_id: string | null
          referrer_last_name: string | null
          service: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      v_referrals_with_company: {
        Row: {
          booking_id: string | null
          company_domain: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          origin_type: string | null
          referral_id: string | null
          referral_status: string | null
          referred_patient_id: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_referrals_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_patient"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_appointments_today_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_timeline_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "crm_unpaid_invoices_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_inactive_patients_6m_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "crm_patient_overview_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients_without_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "admin_referrer_milestones"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrer_summary"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_admin_dashboard_summary"
            referencedColumns: ["top_referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_audit"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_commission_overview"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_performance"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrer_true_pending_commissions"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "v_referrers_with_company"
            referencedColumns: ["referrer_id"]
          },
        ]
      }
      v_referrer_commissions: {
        Row: {
          referrer_code: string | null
          referrer_id: string | null
          referrer_name: string | null
          total_commissions: number | null
          total_earned: number | null
          total_paid: number | null
          total_pending: number | null
        }
        Relationships: []
      }
      v_referrer_performance: {
        Row: {
          booked_referrals: number | null
          company_name: string | null
          confirmed_referrals: number | null
          last_referral_at: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          total_commissions: number | null
          total_referrals: number | null
        }
        Relationships: []
      }
      v_referrer_true_pending_commissions: {
        Row: {
          converted_amount: number | null
          email: string | null
          entries_with_splits: number | null
          paid_amount: number | null
          pending_amount: number | null
          referrer_code: string | null
          referrer_id: string | null
        }
        Relationships: []
      }
      v_referrers_with_company: {
        Row: {
          bank_name: string | null
          commission_rate: number | null
          company_domain: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          iban: string | null
          preferred_payout_method: string | null
          referrer_code: string | null
          referrer_email: string | null
          referrer_id: string | null
          referrer_status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_by_email: { Args: { target_email: string }; Returns: Json }
      add_commission_to_current_batch: {
        Args: { p_commission_id: string }
        Returns: Json
      }
      add_commissions_to_batch: {
        Args: { p_batch_id: string; p_commission_ids: string[] }
        Returns: {
          added_count: number
          skipped_count: number
        }[]
      }
      archive_old_audit_logs: {
        Args: { p_cutoff?: unknown }
        Returns: undefined
      }
      assign_referrer_to_company: {
        Args: { p_company_id: string; p_referrer_id: string }
        Returns: undefined
      }
      auto_assign_all_companies: { Args: never; Returns: Json }
      auto_assign_users_to_company: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_next_due_date: {
        Args: { p_patient_id: string; p_treatment_type: string }
        Returns: string
      }
      check_admin_guard: { Args: { p_email: string }; Returns: undefined }
      cleanup_orphaned_auth_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      cleanup_outgoing_webhooks: {
        Args: { p_days?: number }
        Returns: undefined
      }
      close_commission_batch: {
        Args: { p_admin_user_id: string; p_batch_id: string }
        Returns: undefined
      }
      close_current_payout_batch: {
        Args: { p_batch_id: string; p_payment_date?: string }
        Returns: Json
      }
      create_booking_mapping: {
        Args: { p_booking_id: string; p_external_id: string; p_source: string }
        Returns: boolean
      }
      create_booking_with_mapping: {
        Args: {
          p_booking_value?: number
          p_external_id: string
          p_patient_id: string
          p_service?: string
          p_source: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_category?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_payout_batch: {
        Args: { p_commission_ids: string[]; p_notes?: string }
        Returns: string
      }
      create_pending_reactivation_tasks: {
        Args: never
        Returns: {
          created_count: number
          task_types: Json
        }[]
      }
      create_referrer_account: {
        Args: {
          p_auth_user_id: string
          p_bank_name?: string
          p_company_name?: string
          p_email: string
          p_first_name: string
          p_iban?: string
          p_last_name: string
          p_phone?: string
        }
        Returns: Json
      }
      current_actor_id: { Args: never; Returns: string }
      current_actor_type: { Args: never; Returns: string }
      current_referrer_id: { Args: never; Returns: string }
      current_user_email: { Args: never; Returns: string }
      detect_or_create_referral: {
        Args: {
          p_origin_type?: string
          p_referred_patient_id: string
          p_referrer_patient_id: string
        }
        Returns: string
      }
      detect_referral_for_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      determine_original_acquisition_source: {
        Args: { user_email: string; user_id: string }
        Returns: string
      }
      enforce_admin_access: { Args: { p_email: string }; Returns: undefined }
      enqueue_identity_provisioning: {
        Args: {
          p_email: string
          p_error?: string
          p_first_name?: string
          p_last_name?: string
          p_patient_id: string
          p_phone?: string
          p_source?: string
        }
        Returns: string
      }
      ensure_current_batch: { Args: never; Returns: string }
      ensure_profile_for_current_user: {
        Args: never
        Returns: {
          account_status: string
          address: string | null
          auth_user_id: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          has_auth_account: boolean | null
          iban: string | null
          id: string
          is_referrer: boolean | null
          last_name: string | null
          migration_phase: string | null
          normalized_email: string | null
          normalized_phone: string | null
          notifications_enabled: boolean | null
          original_acquisition_source: string | null
          phone: string | null
          profile_origin: string | null
          referred_by: string | null
          referrer_category_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_referrer_record: { Args: never; Returns: string }
      erase_all_data: { Args: never; Returns: Json }
      execute_readonly_query: { Args: { query_text: string }; Returns: Json }
      expire_old_referrals: { Args: never; Returns: undefined }
      export_batch: {
        Args: { p_batch_id: string; p_format?: string }
        Returns: {
          bank_name: string
          booking_date: string
          booking_id: string
          commission_amount: number
          currency: string
          iban: string
          patient_name: string
          purchase_amount: number
          referrer_email: string
          referrer_name: string
          row_type: string
        }[]
      }
      export_schema_snapshot: { Args: never; Returns: Json }
      fix_invoice_discount: {
        Args: { p_invoice_number: string }
        Returns: undefined
      }
      fix_referral_linkages: { Args: never; Returns: undefined }
      generate_referrer_code:
        | { Args: never; Returns: string }
        | { Args: { p_first_name: string }; Returns: string }
      get_admin_activity_log: {
        Args: never
        Returns: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          details: string
          event_date: string | null
          event_type: string
          id: string
          integration_id: string | null
          metadata: Json | null
          referred_name: string | null
          referrer_code: string | null
          referrer_name: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "activity_feed"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_admin_commission_stats: {
        Args: never
        Returns: {
          confirmed_referrals: number
          referrer_code: string
          referrer_name: string
          total_commission: number
          total_referrals: number
        }[]
      }
      get_admin_referrer_summary_v2: {
        Args: never
        Returns: {
          booked_referrals: number
          company_id: string
          confirmed_referrals: number
          effective_commission_rate: number
          email: string
          full_name: string
          latest_commission_at: string
          latest_referral_at: string
          pending_referrals: number
          referrer_code: string
          referrer_id: string
          referrer_type: string
          status: string
          total_patients: number
          total_referrals: number
        }[]
      }
      get_admin_stats_with_date_filter: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          booked_referrals: number
          commission_earned: number
          commission_outstanding: number
          commission_paid: number
          confirmed_referrals: number
          expired_referrals: number
          pending_referrals: number
          total_referrals: number
          total_referrers: number
        }[]
      }
      get_all_batches: {
        Args: never
        Returns: {
          closed_at: string
          created_at: string
          id: string
          notes: string
          status: string
          total_amount: number
          total_entries: number
        }[]
      }
      get_audit_logs: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_operation?: string
          p_table?: string
          p_user_email?: string
        }
        Returns: {
          changed_data: Json
          id: string
          operation: string
          performed_at: string
          performed_by: string
          performed_by_email: string
          performed_by_name: string
          record_id: string
          table_name: string
        }[]
      }
      get_batch_summary: {
        Args: { batch_uuid: string }
        Returns: {
          closed_at: string
          created_at: string
          id: string
          notes: string
          status: string
          total_amount: number
          total_entries: number
        }[]
      }
      get_commission_batch_details:
        | { Args: { p_batch_id: string }; Returns: Json }
        | {
            Args: {
              p_batch_id: string
              p_end_date?: string
              p_start_date?: string
            }
            Returns: Json
          }
      get_company_employee_analytics: {
        Args: never
        Returns: {
          booked_visits: number
          company_id: string
          company_name: string
          confirmed_visits: number
          created_at: string
          discounts_applied: number
          domains: string[]
          net_revenue: number
          revenue_generated: number
          total_visits: number
        }[]
      }
      get_company_employees: {
        Args: { company_id: string; page_limit?: number; page_offset?: number }
        Returns: Json
      }
      get_company_patient_stats: {
        Args: never
        Returns: {
          booked_patients: number
          company_id: string
          company_name: string
          confirmed_patients: number
          patient_count: number
          total_discount_notes: number
        }[]
      }
      get_company_patients: {
        Args: {
          p_company_id: string
          page_limit?: number
          page_offset?: number
        }
        Returns: Json
      }
      get_company_summary: { Args: { company_id: string }; Returns: Json }
      get_company_trends: {
        Args: { company_id: string; period?: string }
        Returns: Json
      }
      get_conversion_rate_kpi: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_current_batch_with_totals: {
        Args: never
        Returns: {
          bank_name: string
          batch_id: string
          booking_date: string
          booking_id: string
          commission_amount: number
          entry_status: string
          iban: string
          is_total: boolean
          patient_name: string
          purchase_amount: number
          referrer_email: string
          referrer_id: string
          referrer_name: string
        }[]
      }
      get_current_profile_id: { Args: never; Returns: string }
      get_current_referrer_id: { Args: never; Returns: string }
      get_enhanced_company_analytics: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          completed_visits: number
          created_at: string
          discount_rate: number
          discounts_applied: number
          domains: string[]
          employee_count: number
          net_revenue: number
          revenue_generated: number
          total_bookings: number
        }[]
      }
      get_enhanced_company_summary: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_enhanced_company_trends: {
        Args: { p_company_id: string; p_period?: string }
        Returns: Json
      }
      get_final_migration_status: {
        Args: never
        Returns: {
          all_users_migrated: boolean
          legacy_rpcs_removed: boolean
          migration_complete: boolean
          phase: string
        }[]
      }
      get_migration_status: {
        Args: never
        Returns: {
          percent_complete: number
          phase: string
          total_users: number
          users_migrated: number
        }[]
      }
      get_missing_payout_fields: {
        Args: { p_referrer_id: string }
        Returns: string[]
      }
      get_my_notifications: {
        Args: { p_limit?: number; p_offset?: number; p_unread_only?: boolean }
        Returns: {
          category: string
          created_at: string
          id: string
          is_unread: boolean
          message: string
          metadata: Json
          notification_type: string
          priority: string
          read_at: string
        }[]
      }
      get_net_revenue_kpi: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_new_referrals_kpi: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_own_referrer_summary: {
        Args: never
        Returns: {
          booked_referrals: number
          company_id: string
          confirmed_referrals: number
          effective_commission_rate: number
          email: string
          latest_commission_at: string
          latest_referral_at: string
          pending_referrals: number
          referrer_code: string
          referrer_id: string
          referrer_type: string
          status: string
          total_commissions: number
          total_commissions_paid: number
          total_commissions_pending: number
          total_patients: number
          total_referrals: number
        }[]
      }
      get_pending_commissions_kpi: { Args: never; Returns: Json }
      get_recent_activity: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          admin_email: string
          changed_by: string
          created_at: string
          details: Json
          entity: string
          entity_id: string
          id: string
        }[]
      }
      get_referrer_commission_rate:
        | {
            Args: {
              p_patient_id: string
              p_purchase_amount: number
              p_referrer_id: string
            }
            Returns: {
              commission_amount: number
              commission_rate: number
              purchase_type: string
            }[]
          }
        | {
            Args: {
              p_current_booking_id?: string
              p_patient_id: string
              p_purchase_amount: number
              p_referrer_id: string
            }
            Returns: {
              commission_amount: number
              commission_rate: number
              purchase_type: string
            }[]
          }
      get_referrer_dashboard:
        | { Args: never; Returns: Json }
        | {
            Args: { p_end_date?: string; p_start_date?: string }
            Returns: Json
          }
      get_referrer_details:
        | { Args: { p_referrer_id: string }; Returns: Json }
        | {
            Args: {
              p_end_date?: string
              p_referrer_id: string
              p_start_date?: string
            }
            Returns: Json
          }
      get_referrer_type_counts: {
        Args: never
        Returns: {
          code: string
          created_at: string
          description: string
          display_order: number
          first_purchase_rate: number
          id: string
          is_active: boolean
          is_default: boolean
          lapo_cash_conversion_rate: number
          name: string
          referral_discount_fixed: number
          referral_discount_percent: number
          referrer_count: number
          repeat_purchase_rate: number
          updated_at: string
        }[]
      }
      get_safe_commission_amount: {
        Args: { p_commission_entry_id: string }
        Returns: number
      }
      get_schema_snapshot: { Args: never; Returns: Json }
      get_treatment_protocol_for_service: {
        Args: { p_service_name: string }
        Returns: string
      }
      get_user_referrer_id: { Args: never; Returns: string }
      get_user_type: { Args: { user_id: string }; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_active_staff: { Args: { user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_payout_profile_complete: {
        Args: { p_referrer_id: string }
        Returns: boolean
      }
      is_referrer_owner: { Args: { referrer_id: string }; Returns: boolean }
      list_admins: {
        Args: never
        Returns: {
          assigned_by: string
          assigned_by_email: string
          assigned_on: string
          email: string
          user_id: string
        }[]
      }
      log_activity: {
        Args: {
          p_actor_id?: string
          p_actor_type?: string
          p_details: string
          p_event_type: string
          p_integration_id?: string
          p_metadata?: Json
          p_referred_name?: string
          p_referrer_code?: string
          p_referrer_name?: string
        }
        Returns: string
      }
      log_audit: {
        Args: {
          p_changed_data: Json
          p_operation: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: number
      }
      mark_payout_batch_paid:
        | {
            Args: { p_batch_id: string; p_paid_entries: string[] }
            Returns: undefined
          }
        | {
            Args: { p_batch_id: string; p_payment_date?: string }
            Returns: Json
          }
      move_commission_to_current_batch: {
        Args: { p_commission_id: string }
        Returns: Json
      }
      normalize_name: { Args: { input_text: string }; Returns: string }
      normalize_phone: { Args: { phone_input: string }; Returns: string }
      normalize_phone_number: { Args: { phone_input: string }; Returns: string }
      populate_demo_data: {
        Args: { p_count: number; p_randomize?: boolean }
        Returns: Json
      }
      profile_completeness_score: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      queue_email_notification: {
        Args: {
          p_merge_fields?: Json
          p_recipient_email: string
          p_recipient_id?: string
          p_template_key: string
        }
        Returns: string
      }
      recalc_all_referrer_summary: { Args: never; Returns: undefined }
      recalc_patient_based_counts: {
        Args: { p_referrer_code: string }
        Returns: undefined
      }
      recalc_unique_confirmed_patients: {
        Args: { p_referrer_code: string }
        Returns: undefined
      }
      recalculate_company_discounts: {
        Args: { company_id: string }
        Returns: undefined
      }
      recognize_company_and_create_note: {
        Args: {
          p_booking_id: string
          p_patient_email: string
          p_referrer_code?: string
        }
        Returns: string
      }
      remove_admin_role: { Args: { target_user_id: string }; Returns: Json }
      remove_commission_from_batch: {
        Args: { p_batch_id: string; p_commission_id: string }
        Returns: boolean
      }
      remove_commission_from_current_batch: {
        Args: { p_commission_id: string }
        Returns: Json
      }
      reset_demo: { Args: never; Returns: Json }
      reset_transactional_data: { Args: never; Returns: Json }
      resolve_booking_uuid: {
        Args: { p_external_id: string; p_source: string }
        Returns: {
          booking_id: string
          error_message: string
          found: boolean
        }[]
      }
      retry_failed_exports: { Args: never; Returns: undefined }
      retry_failed_notes: { Args: never; Returns: undefined }
      retry_failed_webhooks: { Args: never; Returns: undefined }
      rpc_add_referrer_category: {
        Args: { p_description?: string; p_name: string }
        Returns: string
      }
      rpc_admin_bulk_delete_referrals: {
        Args: { p_referral_ids: string[] }
        Returns: Json
      }
      rpc_admin_commission_totals: {
        Args: never
        Returns: {
          paid_count: number
          pending_count: number
          referrer_id: string
          total_commission_count: number
          total_commissions: number
          total_paid: number
          total_pending: number
        }[]
      }
      rpc_admin_delete_milestone_reward: {
        Args: { p_id: string }
        Returns: undefined
      }
      rpc_admin_delete_referral: {
        Args: { p_referral_id: string }
        Returns: Json
      }
      rpc_admin_delete_referrer_category: {
        Args: { p_id: string }
        Returns: undefined
      }
      rpc_admin_delete_user: { Args: { p_user_id: string }; Returns: Json }
      rpc_admin_list_milestone_rewards: {
        Args: { p_category_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          milestone_threshold: number
          milestone_type: string
          reward_description_en: string
          reward_description_fr: string
          reward_type: string
          reward_value: number
          tier_name: string
          tier_order: number
          updated_at: string
        }[]
      }
      rpc_admin_list_referrer_categories: {
        Args: never
        Returns: {
          commission_first_pct: number
          commission_repeat_pct: number
          created_at: string
          description: string
          id: string
          is_active: boolean
          milestone_threshold: number
          milestone_type: string
          name: string
          referrers_count: number
          reward_description_en: string
          reward_description_fr: string
          reward_type: string
          reward_value: number
          updated_at: string
        }[]
      }
      rpc_admin_list_users:
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_role?: string
              p_search?: string
              p_sort_by?: string
              p_sort_order?: string
              p_status?: string
            }
            Returns: {
              confirmed_at: string
              created_at: string
              email: string
              first_name: string
              id: string
              is_referrer: boolean
              last_name: string
              last_sign_in_at: string
              phone: string
              referrer_code: string
              role: Database["public"]["Enums"]["user_role"]
              total_commissions: number
              total_referrals: number
            }[]
          }
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_segment?: string
            }
            Returns: {
              acquisition_source: string
              company_name: string
              created_at: string
              email: string
              first_name: string
              full_name: string
              id: string
              is_patient: boolean
              is_pending_referral: boolean
              is_referral: boolean
              is_referrer: boolean
              last_activity: string
              last_name: string
              referred_by: string
              referred_by_email: string
              referred_by_name: string
              referrer_category_id: string
              referrer_category_name: string
              referrer_code: string
              referrer_type: string
              role: Database["public"]["Enums"]["user_role"]
              status: string
              total_commissions: number
              total_referrals: number
              user_type: string
            }[]
          }
      rpc_admin_update_profile: {
        Args: {
          p_address?: string
          p_bank_name?: string
          p_category_id?: string
          p_email?: string
          p_first_name?: string
          p_iban?: string
          p_last_name?: string
          p_phone?: string
          p_profile_id: string
          p_role?: string
        }
        Returns: Json
      }
      rpc_admin_update_referral: {
        Args: {
          p_referral_id: string
          p_referred_email?: string
          p_referred_first_name?: string
          p_referred_last_name?: string
          p_referrer_code?: string
          p_referrer_id?: string
        }
        Returns: Json
      }
      rpc_admin_update_user: {
        Args: { p_profile_id: string; p_referrer_type?: string; p_role: string }
        Returns: undefined
      }
      rpc_admin_update_user_bank_info: {
        Args: {
          p_address?: string
          p_bank_name?: string
          p_iban?: string
          p_user_id: string
        }
        Returns: undefined
      }
      rpc_admin_update_user_info: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone?: string
          p_user_id: string
        }
        Returns: undefined
      }
      rpc_admin_upsert_milestone_reward: {
        Args: {
          p_category_id: string
          p_id: string
          p_is_active?: boolean
          p_milestone_threshold: number
          p_milestone_type?: string
          p_reward_description_en: string
          p_reward_description_fr: string
          p_reward_type: string
          p_reward_value: number
          p_tier_name: string
          p_tier_order: number
        }
        Returns: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          milestone_threshold: number
          milestone_type: string
          reward_description_en: string
          reward_description_fr: string
          reward_type: string
          reward_value: number
          tier_name: string
          tier_order: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "referrer_milestone_rewards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_admin_upsert_patient_profile: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_patient_id: string
        }
        Returns: undefined
      }
      rpc_admin_upsert_referrer_category: {
        Args: {
          p_description: string
          p_first_pct: number
          p_id: string
          p_is_active?: boolean
          p_milestone_threshold?: number
          p_milestone_type?: string
          p_name: string
          p_repeat_pct: number
          p_reward_description_en?: string
          p_reward_description_fr?: string
          p_reward_type?: string
          p_reward_value?: number
        }
        Returns: {
          commission_first_pct: number
          commission_repeat_pct: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          milestone_threshold: number | null
          milestone_type: string | null
          name: string
          reward_description_en: string | null
          reward_description_fr: string | null
          reward_type: string | null
          reward_value: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "referrer_categories"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_admin_user_commissions: {
        Args: { p_user_id: string }
        Returns: {
          batch_id: string
          booking_id: string
          commission_amount: number
          created_at: string
          id: string
          status: string
        }[]
      }
      rpc_admin_user_counts: { Args: never; Returns: Json }
      rpc_admin_user_overview: {
        Args: { p_profile_id: string }
        Returns: {
          confirmed_referrals: number
          email: string
          full_name: string
          is_referrer: boolean
          last_activity: string
          pending_commissions: number
          profile_id: string
          referrer_code: string
          referrer_id: string
          referrer_type: string
          role: string
          total_commissions: number
          total_referrals: number
        }[]
      }
      rpc_admin_user_payout_profile: {
        Args: { p_user_id: string }
        Returns: {
          address: string
          bank_name: string
          iban: string
          is_complete: boolean
          phone_number: string
        }[]
      }
      rpc_admin_user_referrals: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          created_at: string
          id: string
          referral_status: string
          referred_email: string
          referred_first_name: string
          referred_last_name: string
        }[]
      }
      rpc_backfill_company_assignments: { Args: never; Returns: Json }
      rpc_batch_dashboard: {
        Args: never
        Returns: {
          batch_id: string
          closed_at: string
          created_at: string
          notes: string
          status: string
          total_amount: number
          total_count: number
          total_paid: number
          total_referrers: number
          updated_at: string
        }[]
      }
      rpc_bulk_update_payouts:
        | {
            Args: {
              batch_notes?: string
              commission_ids: string[]
              new_status: string
            }
            Returns: Json
          }
        | {
            Args: { new_status: string; payout_ids: string[] }
            Returns: undefined
          }
      rpc_bulk_update_payouts_with_profile_check: {
        Args: { new_status: string; payout_ids: string[] }
        Returns: Json
      }
      rpc_close_payout_batch: {
        Args: { p_batch_id: string }
        Returns: {
          total_amount: number
          updated_count: number
        }[]
      }
      rpc_commission_dashboard: { Args: { p_referrer: string }; Returns: Json }
      rpc_company_analytics: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          latest_activity: string
          total_commissions: number
          total_commissions_paid: number
          total_commissions_pending: number
          total_patients: number
          total_referrals: number
          total_referrers: number
        }[]
      }
      rpc_create_payout_batch:
        | {
            Args: { p_batch_label?: string; p_commission_ids: string[] }
            Returns: {
              commission_count: number
              payout_batch_id: string
              total_commissions: number
            }[]
          }
        | { Args: { p_notes?: string }; Returns: Json }
      rpc_create_referral:
        | {
            Args: { p_email: string; p_first_name: string; p_last_name: string }
            Returns: Json
          }
        | {
            Args: {
              p_origin_type?: string
              p_referred_patient_id: string
              p_referrer_id: string
            }
            Returns: Json
          }
      rpc_dashboard_batches: { Args: { p_admin_email: string }; Returns: Json }
      rpc_dashboard_commissions: {
        Args: { p_admin_email: string; p_batch_id: string }
        Returns: Json
      }
      rpc_dashboard_errors: { Args: { p_admin_email: string }; Returns: Json }
      rpc_dashboard_overview: { Args: { p_admin_email: string }; Returns: Json }
      rpc_delete_company: { Args: { p_company_id: string }; Returns: undefined }
      rpc_delete_referrer_category: {
        Args: { p_id: string }
        Returns: undefined
      }
      rpc_delete_test_data: { Args: never; Returns: undefined }
      rpc_e2e_test: {
        Args: { p_action?: string; p_clean?: boolean; p_count?: number }
        Returns: Json
      }
      rpc_erase_all_data: { Args: { p_admin_email: string }; Returns: Json }
      rpc_export_analytics_data: {
        Args: {
          p_category_id?: string
          p_company_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_export_batch_rows: {
        Args: { p_batch_id: string }
        Returns: {
          amount_chf: number
          bank_name: string
          batch_id: string
          beneficiary_email: string
          beneficiary_name: string
          iban: string
          payment_reference: string
          referrer_id: string
        }[]
      }
      rpc_export_commissions:
        | {
            Args: never
            Returns: {
              booking_id: string
              commission_amount: number
              commission_id: string
              created_at: string
              paid_at: string
              referrer_email: string
              referrer_id: string
              status: string
            }[]
          }
        | { Args: { p_filters?: Json }; Returns: Json }
      rpc_export_payout_batch: {
        Args: { p_batch_id: string }
        Returns: {
          amount_chf: number
          bank_name: string
          batch_id: string
          beneficiary_name: string
          created_at: string
          iban: string
          referrer_email: string
        }[]
      }
      rpc_export_revenue_report: {
        Args: {
          p_company_id?: string
          p_end_date?: string
          p_report_type?: string
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_finalize_batch: {
        Args: { p_batch_id: string; p_notes?: string }
        Returns: Json
      }
      rpc_find_or_create_patient_for_referral: {
        Args: {
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_referrer_id?: string
        }
        Returns: Json
      }
      rpc_get_admin_commissions: {
        Args: { filters?: Json }
        Returns: {
          batch_id: string
          booking_id: string
          commission_amount: number
          commission_id: string
          commission_rate: number
          created_at: string
          paid_at: string
          purchase_amount: number
          referrer_code: string
          referrer_name: string
          status: string
        }[]
      }
      rpc_get_admin_dashboard: { Args: never; Returns: Json }
      rpc_get_admin_overview: { Args: never; Returns: Json }
      rpc_get_admin_referrers: { Args: { p_filters?: Json }; Returns: Json }
      rpc_get_audit_log: {
        Args: { p_limit?: number }
        Returns: {
          admin_email: string
          changed_data: Json
          id: string
          operation: string
          performed_at: string
          performed_by: string
          record_id: string
          table_name: string
        }[]
      }
      rpc_get_batch_details: {
        Args: { p_batch_id: string }
        Returns: {
          address: string
          bank_name: string
          commission_amount: number
          commission_id: string
          iban: string
          missing_fields: string[]
          phone: string
          profile_complete: boolean
          referrer_email: string
          referrer_id: string
          referrer_name: string
          status: string
        }[]
      }
      rpc_get_commission_analytics: {
        Args: {
          p_end_date?: string
          p_group_by?: string
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_get_communications_stats: { Args: never; Returns: Json }
      rpc_get_dashboard_summary:
        | {
            Args: { p_admin_email: string; p_include_errors?: boolean }
            Returns: Json
          }
        | { Args: { p_include_errors?: boolean }; Returns: Json }
      rpc_get_incomplete_profiles: {
        Args: never
        Returns: {
          email: string
          first_name: string
          iban: string
          id: string
          is_referrer: boolean
          last_name: string
          phone: string
        }[]
      }
      rpc_get_incomplete_profiles_for_notification: {
        Args: never
        Returns: {
          missing_fields: string[]
          pending_commission_amount: number
          pending_commission_count: number
          referrer_email: string
          referrer_id: string
          referrer_name: string
        }[]
      }
      rpc_get_my_payout_profile: {
        Args: never
        Returns: {
          address: string
          bank_name: string
          iban: string
          is_complete: boolean
          phone_number: string
        }[]
      }
      rpc_get_performance_metrics: {
        Args: { p_period?: string }
        Returns: Json
      }
      rpc_get_referral_analytics: {
        Args: {
          p_category_id?: string
          p_company_id?: string
          p_end_date?: string
          p_group_by?: string
          p_referrer_id?: string
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_get_referral_history: {
        Args: { p_referrer_id: string }
        Returns: {
          booking_id: string
          created_at: string
          id: string
          referral_status: string
          referred_email: string
          referred_first_name: string
          referred_last_name: string
        }[]
      }
      rpc_get_referral_history_admin: {
        Args: { p_referrer_id: string }
        Returns: {
          booking_id: string
          created_at: string
          referral_id: string
          referral_status: string
          referred_email: string
          referred_first_name: string
          referred_last_name: string
          referred_phone: string
        }[]
      }
      rpc_get_referrer_dashboard:
        | { Args: never; Returns: Json }
        | { Args: { p_email: string }; Returns: Json }
        | { Args: { p_referrer_id: string }; Returns: Json }
      rpc_get_referrer_leaderboard: {
        Args: {
          p_category_id?: string
          p_company_id?: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_get_referrer_milestones: { Args: never; Returns: Json }
      rpc_get_referrer_referrals:
        | { Args: { p_referrer_id: string; p_status?: string }; Returns: Json }
        | { Args: { p_status?: string }; Returns: Json }
      rpc_get_revenue_analytics: {
        Args: {
          p_company_id?: string
          p_end_date?: string
          p_referrer_id?: string
          p_start_date?: string
        }
        Returns: Json
      }
      rpc_get_system_health: { Args: never; Returns: Json }
      rpc_global_summary: { Args: never; Returns: Json }
      rpc_incentive_progress: { Args: { p_referrer_id: string }; Returns: Json }
      rpc_latest_batch_commissions: { Args: never; Returns: Json[] }
      rpc_list_ineligible_commissions:
        | {
            Args: never
            Returns: {
              blocked_reason: string
              commission_amount: number
              commission_count: number
              referrer_code: string
              referrer_id: string
              referrer_name: string
            }[]
          }
        | {
            Args: {
              p_company_id?: string
              p_end_date?: string
              p_referrer_id?: string
              p_start_date?: string
            }
            Returns: {
              commission_amount: number
              commission_id: string
              reason: string
              referrer_id: string
              referrer_name: string
            }[]
          }
      rpc_list_non_admin_auth_users: {
        Args: { p_preserve_id: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      rpc_list_referrer_categories: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          name: string
          referrer_count: number
        }[]
      }
      rpc_patient_referral_history: {
        Args: { p_patient: string }
        Returns: Json
      }
      rpc_populate_demo_data: {
        Args: { p_admin_email: string; p_count: number; p_randomize: boolean }
        Returns: Json
      }
      rpc_retry_commissions: { Args: never; Returns: Json }
      rpc_retry_failed_commissions: { Args: never; Returns: Json }
      rpc_reverse_batch: {
        Args: { p_batch: string; p_reason: string }
        Returns: Json
      }
      rpc_send_bulk_message: {
        Args: {
          p_custom_emails?: string[]
          p_segment?: string
          p_template_key: string
        }
        Returns: Json
      }
      rpc_send_incomplete_profile_notifications: {
        Args: { p_referrer_ids: string[] }
        Returns: Json
      }
      rpc_test_toolkit: {
        Args: {
          p_action: string
          p_admin_email?: string
          p_count?: number
          p_randomize?: boolean
          p_with_batch?: boolean
        }
        Returns: Json
      }
      rpc_toggle_company_active: {
        Args: { p_active: boolean; p_company_id: string }
        Returns: undefined
      }
      rpc_update_my_payout_profile: {
        Args: {
          p_address: string
          p_bank_name: string
          p_iban: string
          p_phone: string
        }
        Returns: {
          address: string
          bank_name: string
          iban: string
          is_complete: boolean
          phone_number: string
        }[]
      }
      rpc_update_profile_category: {
        Args: { p_category_id: string; p_profile_id: string }
        Returns: undefined
      }
      rpc_update_referrer_category: {
        Args: { p_description?: string; p_id: string; p_name: string }
        Returns: undefined
      }
      rpc_upsert_company: { Args: { p_data: Json }; Returns: string }
      rpc_validate_e2e_test_run: {
        Args: { p_include_errors?: boolean }
        Returns: Json
      }
      run_full_simulation: { Args: never; Returns: Json }
      run_phase3_test: { Args: never; Returns: Json }
      run_test_simulation: { Args: never; Returns: Json }
      send_automated_email: {
        Args: {
          p_merge_fields?: Json
          p_recipient_email: string
          p_recipient_id?: string
          p_template_key: string
        }
        Returns: string
      }
      send_notification:
        | {
            Args: {
              p_code: string
              p_message: string
              p_title: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_message: string
              p_metadata?: Json
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
      send_payout_profile_reminder: {
        Args: { p_referrer_id: string }
        Returns: Json
      }
      send_payout_reminder: { Args: { p_referrer_id: string }; Returns: Json }
      show_data_summary: { Args: never; Returns: Json }
      soft_delete_account: { Args: { user_id: string }; Returns: undefined }
      soft_delete_user_account: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sync_current_payout_batch: { Args: never; Returns: Json }
      sync_payout_profile: { Args: { p_user_id: string }; Returns: undefined }
      test_toolkit:
        | {
            Args: {
              p_action: string
              p_admin_email: string
              p_count?: number
              p_randomize?: boolean
            }
            Returns: Json
          }
        | {
            Args: {
              p_action: string
              p_admin_email?: string
              p_confirm?: string
              p_count?: number
              p_randomize?: boolean
            }
            Returns: Json
          }
      update_batch_status: {
        Args: { p_batch_id: string; p_new_status: string }
        Returns: boolean
      }
      update_patient_data_from_booking: {
        Args: {
          p_date_of_birth?: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_patient_id: string
          p_phone?: string
        }
        Returns: undefined
      }
      update_referrer_type_commissions: {
        Args: {
          p_description?: string
          p_first_purchase: number
          p_repeat_purchase: number
          p_type_name: string
        }
        Returns: undefined
      }
      update_webhook_status: {
        Args: { p_error?: string; p_id: string; p_status: string }
        Returns: undefined
      }
      upgrade_guest_by_email: {
        Args: { p_auth_id: string; p_email: string }
        Returns: Json
      }
      upgrade_guest_to_active: {
        Args: { p_auth_id: string; p_profile_id: string }
        Returns: Json
      }
      upsert_patient_and_booking:
        | {
            Args: {
              p_booking_date: string
              p_booking_id: string
              p_city: string
              p_client_id: string
              p_company_domain: string
              p_country: string
              p_date_of_birth: string
              p_email: string
              p_first_name: string
              p_last_name: string
              p_marketing_opt_in: boolean
              p_notes: string
              p_phone: string
              p_postal_code: string
              p_preferred_language: string
              p_referrer_code: string
              p_service: string
              p_source: string
              p_status: string
              p_street: string
            }
            Returns: string
          }
        | {
            Args: {
              p_booking_date: string
              p_booking_id: string
              p_city: string
              p_company_domain: string
              p_country: string
              p_date_of_birth: string
              p_email: string
              p_first_name: string
              p_last_name: string
              p_marketing_opt_in: boolean
              p_notes: string
              p_phone: string
              p_postal_code: string
              p_referrer_code: string
              p_service: string
              p_source: string
              p_status: string
              p_street: string
            }
            Returns: string
          }
      upsert_profile_by_email: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
      validate_e2e_test_run: { Args: never; Returns: Json }
      validate_unified_data: {
        Args: never
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      referral_status:
        | "pending"
        | "booked"
        | "completed"
        | "cancelled"
        | "invalid"
      user_role: "admin" | "referrer" | "patient" | "user" | "clinic_staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      referral_status: [
        "pending",
        "booked",
        "completed",
        "cancelled",
        "invalid",
      ],
      user_role: ["admin", "referrer", "patient", "user", "clinic_staff"],
    },
  },
} as const
