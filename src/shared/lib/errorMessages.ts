/**
 * User-Friendly Error Messages
 *
 * Maps technical error codes and messages to user-friendly messages via i18n.
 * Used throughout the app to provide better UX for error handling.
 */

import i18n from '@/i18n';

type ErrorCode = string;

interface ErrorMapping {
  title: string;
  message: string;
  action?: string;
}

// Map of known error codes to i18n keys
function getErrorMappings(): Record<ErrorCode, ErrorMapping> {
  return {
    // Authentication errors
    'auth/invalid-email': {
      title: i18n.t('errors:invalidEmail.title'),
      message: i18n.t('errors:invalidEmail.message'),
      action: i18n.t('errors:invalidEmail.action'),
    },
    'auth/user-not-found': {
      title: i18n.t('errors:userNotFound.title'),
      message: i18n.t('errors:userNotFound.message'),
      action: i18n.t('errors:userNotFound.action'),
    },
    'auth/wrong-password': {
      title: i18n.t('errors:wrongPassword.title'),
      message: i18n.t('errors:wrongPassword.message'),
      action: i18n.t('errors:wrongPassword.action'),
    },
    'auth/email-already-in-use': {
      title: i18n.t('errors:emailInUse.title'),
      message: i18n.t('errors:emailInUse.message'),
      action: i18n.t('errors:emailInUse.action'),
    },
    'auth/weak-password': {
      title: i18n.t('errors:weakPassword.title'),
      message: i18n.t('errors:weakPassword.message'),
    },
    'auth/session-expired': {
      title: i18n.t('errors:sessionExpired.title'),
      message: i18n.t('errors:sessionExpired.message'),
      action: i18n.t('errors:sessionExpired.action'),
    },

    // Database errors
    '23505': {
      title: i18n.t('errors:duplicate.title'),
      message: i18n.t('errors:duplicate.message'),
      action: i18n.t('errors:duplicate.action'),
    },
    '23503': {
      title: i18n.t('errors:invalidReference.title'),
      message: i18n.t('errors:invalidReference.message'),
    },
    '42501': {
      title: i18n.t('errors:accessDenied.title'),
      message: i18n.t('errors:accessDenied.message'),
      action: i18n.t('errors:accessDenied.action'),
    },
    'PGRST301': {
      title: i18n.t('errors:notFound.title'),
      message: i18n.t('errors:notFound.message'),
    },

    // Network errors
    'network_error': {
      title: i18n.t('errors:networkError.title'),
      message: i18n.t('errors:networkError.message'),
      action: i18n.t('errors:networkError.action'),
    },
    'timeout': {
      title: i18n.t('errors:timeout.title'),
      message: i18n.t('errors:timeout.message'),
      action: i18n.t('errors:timeout.action'),
    },

    // Rate limiting
    'rate_limit_exceeded': {
      title: i18n.t('errors:rateLimited.title'),
      message: i18n.t('errors:rateLimited.message'),
      action: i18n.t('errors:rateLimited.action'),
    },

    // Commission/Conversion errors
    'CONVERSION_IN_PROGRESS': {
      title: i18n.t('errors:conversionInProgress.title'),
      message: i18n.t('errors:conversionInProgress.message'),
      action: i18n.t('errors:conversionInProgress.action'),
    },
    'insufficient_balance': {
      title: i18n.t('errors:insufficientBalance.title'),
      message: i18n.t('errors:insufficientBalance.message'),
    },
    'insufficient_commissions': {
      title: i18n.t('errors:insufficientCommissions.title'),
      message: i18n.t('errors:insufficientCommissions.message'),
    },
    'auto_payout_enabled': {
      title: i18n.t('errors:autoPayoutEnabled.title'),
      message: i18n.t('errors:autoPayoutEnabled.message'),
      action: i18n.t('errors:autoPayoutEnabled.action'),
    },

    // Referral errors
    'referral_not_found': {
      title: i18n.t('errors:referralNotFound.title'),
      message: i18n.t('errors:referralNotFound.message'),
    },
    'referrer_not_found': {
      title: i18n.t('errors:referrerNotFound.title'),
      message: i18n.t('errors:referrerNotFound.message'),
    },
    'patient_not_found': {
      title: i18n.t('errors:patientNotFound.title'),
      message: i18n.t('errors:patientNotFound.message'),
    },
    'invalid_referrer_code': {
      title: i18n.t('errors:invalidCode.title'),
      message: i18n.t('errors:invalidCode.message'),
    },

    // Validation errors
    'validation_error': {
      title: i18n.t('errors:validationError.title'),
      message: i18n.t('errors:validationError.message'),
      action: i18n.t('errors:validationError.action'),
    },
    'missing_required_fields': {
      title: i18n.t('errors:missingFields.title'),
      message: i18n.t('errors:missingFields.message'),
    },
  };
}

// Default error message for unknown errors
function getDefaultError(): ErrorMapping {
  return {
    title: i18n.t('errors:defaultTitle'),
    message: i18n.t('errors:defaultMessage'),
    action: i18n.t('errors:defaultAction'),
  };
}

/**
 * Get user-friendly error message from error code or message
 */
export function getErrorMessage(error: unknown): ErrorMapping {
  const defaultError = getDefaultError();
  if (!error) return defaultError;

  // Extract error code/message
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  if (typeof error === 'string') {
    errorCode = error;
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Try to extract code from message
    errorCode = error.message;
  } else if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    errorCode = (err.code as string) || (err.error as string) || (err.status as string)?.toString();
    errorMessage = (err.message as string) || (err.error_description as string);
  }

  const errorMappings = getErrorMappings();

  // Check for known error codes
  if (errorCode && errorMappings[errorCode]) {
    return errorMappings[errorCode];
  }

  // Check if message contains known patterns
  if (errorMessage) {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return errorMappings['network_error'];
    }
    if (lowerMessage.includes('timeout')) {
      return errorMappings['timeout'];
    }
    if (lowerMessage.includes('duplicate') || lowerMessage.includes('unique')) {
      return errorMappings['23505'];
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
      return errorMappings['42501'];
    }
    if (lowerMessage.includes('not found')) {
      return errorMappings['PGRST301'];
    }
  }

  // Return default with original message in dev mode
  if (process.env.NODE_ENV === 'development' && errorMessage) {
    return {
      ...defaultError,
      message: errorMessage,
    };
  }

  return defaultError;
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): { title: string; description: string } {
  const { title, message, action } = getErrorMessage(error);
  return {
    title,
    description: action ? `${message} ${action}` : message,
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('offline');
  }

  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const err = error as Record<string, unknown>;
  const code = (err.code as string) || '';
  const status = err.status as number;

  return code.startsWith('auth/') || status === 401 || status === 403;
}
