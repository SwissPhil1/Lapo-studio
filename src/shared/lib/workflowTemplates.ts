export interface WorkflowTemplate {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  steps: {
    action: string;
    config: Record<string, unknown>;
  }[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder Series',
    nameKey: 'workflowTemplates.appointmentReminder',
    description: 'Send reminders 48h and 24h before an appointment to reduce no-shows.',
    descriptionKey: 'workflowTemplates.appointmentReminderDesc',
    triggerType: 'booking_upcoming',
    triggerConfig: { days_before: 2 },
    steps: [
      {
        action: 'send_email',
        config: {
          subject: 'Your appointment is in 2 days',
          template: 'reminder_48h',
        },
      },
      {
        action: 'wait',
        config: { delay_hours: 24 },
      },
      {
        action: 'send_email',
        config: {
          subject: 'Your appointment is tomorrow',
          template: 'reminder_24h',
        },
      },
    ],
  },
  {
    id: 'post-treatment-followup',
    name: 'Post-Treatment Follow-up',
    nameKey: 'workflowTemplates.postTreatment',
    description: 'Send a satisfaction check 3 days after treatment, then a recall reminder.',
    descriptionKey: 'workflowTemplates.postTreatmentDesc',
    triggerType: 'days_since_visit',
    triggerConfig: { days: 3 },
    steps: [
      {
        action: 'send_email',
        config: {
          subject: 'How was your treatment?',
          template: 'satisfaction_check',
        },
      },
      {
        action: 'wait',
        config: { delay_days: 25 },
      },
      {
        action: 'send_email',
        config: {
          subject: 'Time for your next session?',
          template: 'recall_reminder',
        },
      },
    ],
  },
  {
    id: 'reactivation-90-days',
    name: 'Reactivation After 90 Days',
    nameKey: 'workflowTemplates.reactivation90',
    description: 'Automatically reach out to patients who haven\'t visited in 90 days.',
    descriptionKey: 'workflowTemplates.reactivation90Desc',
    triggerType: 'days_since_visit',
    triggerConfig: { days: 90 },
    steps: [
      {
        action: 'send_email',
        config: {
          subject: 'We miss you!',
          template: 'reactivation_email',
        },
      },
      {
        action: 'wait',
        config: { delay_days: 7 },
      },
      {
        action: 'create_task',
        config: {
          task_type: 'dormant',
          priority: 'normal',
          notes: 'Patient did not respond to reactivation email',
        },
      },
    ],
  },
  {
    id: 'no-show-recovery',
    name: 'No-Show Recovery',
    nameKey: 'workflowTemplates.noShowRecovery',
    description: 'When a patient misses their appointment, send a rebooking prompt and create a follow-up task.',
    descriptionKey: 'workflowTemplates.noShowRecoveryDesc',
    triggerType: 'booking_cancelled',
    triggerConfig: {},
    steps: [
      {
        action: 'wait',
        config: { delay_hours: 2 },
      },
      {
        action: 'send_email',
        config: {
          subject: 'We missed you — rebook easily',
          template: 'no_show_rebook',
        },
      },
      {
        action: 'create_task',
        config: {
          task_type: 'no_show_followup',
          priority: 'high',
          notes: 'Follow up with patient who missed appointment',
        },
      },
    ],
  },
];
