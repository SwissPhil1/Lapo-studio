/**
 * User-Friendly Error Messages
 *
 * Maps technical error codes and messages to user-friendly messages in French.
 * Used throughout the app to provide better UX for error handling.
 */

type ErrorCode = string;

interface ErrorMapping {
  title: string;
  message: string;
  action?: string;
}

// Map of known error codes to user-friendly messages
const errorMappings: Record<ErrorCode, ErrorMapping> = {
  // Authentication errors
  'auth/invalid-email': {
    title: 'Email invalide',
    message: 'L\'adresse email fournie n\'est pas valide.',
    action: 'Vérifiez l\'adresse email et réessayez.',
  },
  'auth/user-not-found': {
    title: 'Utilisateur non trouvé',
    message: 'Aucun compte n\'existe avec cette adresse email.',
    action: 'Vérifiez l\'email ou créez un nouveau compte.',
  },
  'auth/wrong-password': {
    title: 'Mot de passe incorrect',
    message: 'Le mot de passe saisi est incorrect.',
    action: 'Réessayez ou utilisez "Mot de passe oublié".',
  },
  'auth/email-already-in-use': {
    title: 'Email déjà utilisé',
    message: 'Un compte existe déjà avec cette adresse email.',
    action: 'Connectez-vous ou utilisez une autre adresse.',
  },
  'auth/weak-password': {
    title: 'Mot de passe trop faible',
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  },
  'auth/session-expired': {
    title: 'Session expirée',
    message: 'Votre session a expiré pour des raisons de sécurité.',
    action: 'Veuillez vous reconnecter.',
  },

  // Database errors
  '23505': {
    title: 'Doublon détecté',
    message: 'Cette entrée existe déjà dans le système.',
    action: 'Vérifiez les données existantes.',
  },
  '23503': {
    title: 'Référence invalide',
    message: 'L\'élément référencé n\'existe pas ou a été supprimé.',
  },
  '42501': {
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les permissions nécessaires.',
    action: 'Contactez un administrateur si vous pensez que c\'est une erreur.',
  },
  'PGRST301': {
    title: 'Non trouvé',
    message: 'L\'élément demandé n\'existe pas ou a été supprimé.',
  },

  // Network errors
  'network_error': {
    title: 'Erreur réseau',
    message: 'Impossible de se connecter au serveur.',
    action: 'Vérifiez votre connexion internet et réessayez.',
  },
  'timeout': {
    title: 'Délai dépassé',
    message: 'La requête a pris trop de temps.',
    action: 'Réessayez dans quelques instants.',
  },

  // Rate limiting
  'rate_limit_exceeded': {
    title: 'Trop de requêtes',
    message: 'Vous avez effectué trop de requêtes.',
    action: 'Attendez quelques secondes avant de réessayer.',
  },

  // Commission/Conversion errors
  'CONVERSION_IN_PROGRESS': {
    title: 'Conversion en cours',
    message: 'Une autre conversion est déjà en cours pour cet ambassadeur.',
    action: 'Attendez quelques secondes et réessayez.',
  },
  'insufficient_balance': {
    title: 'Solde insuffisant',
    message: 'Le solde LAPO Cash est insuffisant pour cette opération.',
  },
  'insufficient_commissions': {
    title: 'Commissions insuffisantes',
    message: 'Le montant des commissions en attente est insuffisant.',
  },
  'auto_payout_enabled': {
    title: 'Versement automatique activé',
    message: 'La conversion LAPO Cash n\'est pas disponible avec le versement automatique.',
    action: 'Désactivez le versement automatique pour convertir en LAPO Cash.',
  },

  // Referral errors
  'referral_not_found': {
    title: 'Parrainage non trouvé',
    message: 'Ce parrainage n\'existe pas ou a été supprimé.',
  },
  'referrer_not_found': {
    title: 'Ambassadeur non trouvé',
    message: 'Cet ambassadeur n\'existe pas dans le système.',
  },
  'patient_not_found': {
    title: 'Patient non trouvé',
    message: 'Ce patient n\'existe pas dans le système.',
  },
  'invalid_referrer_code': {
    title: 'Code invalide',
    message: 'Le code ambassadeur n\'est pas valide.',
  },

  // Validation errors
  'validation_error': {
    title: 'Données invalides',
    message: 'Certaines informations sont incorrectes ou manquantes.',
    action: 'Vérifiez les champs du formulaire.',
  },
  'missing_required_fields': {
    title: 'Champs obligatoires',
    message: 'Certains champs obligatoires ne sont pas remplis.',
  },
};

// Default error message for unknown errors
const defaultError: ErrorMapping = {
  title: 'Une erreur est survenue',
  message: 'Une erreur inattendue s\'est produite.',
  action: 'Réessayez ou contactez le support si le problème persiste.',
};

/**
 * Get user-friendly error message from error code or message
 */
export function getErrorMessage(error: unknown): ErrorMapping {
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
