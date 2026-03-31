export interface ConsentFormField {
  id: string;
  type: 'checkbox' | 'text' | 'textarea' | 'signature' | 'info';
  label: string;
  required: boolean;
  value?: string | boolean;
}

export interface ConsentFormTemplate {
  id: string;
  name: string;
  description: string | null;
  fields: ConsentFormField[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentFormResponse {
  id: string;
  template_id: string;
  patient_id: string;
  booking_id: string | null;
  responses: Record<string, string | boolean>;
  signed_at: string | null;
  signature_data: string | null;
  created_at: string;
  template?: ConsentFormTemplate;
  patients?: {
    first_name: string;
    last_name: string;
  };
}
