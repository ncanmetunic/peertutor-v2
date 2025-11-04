// Firebase error code to user-friendly message mapping

export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    // Authentication errors
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',

    // Firestore errors
    'firestore/permission-denied': 'You do not have permission to perform this action.',
    'firestore/unavailable': 'Service unavailable. Please try again later.',

    // Storage errors
    'storage/unauthorized': 'You do not have permission to upload files.',
    'storage/canceled': 'Upload was canceled.',
    'storage/unknown': 'An unknown error occurred during upload.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

export const handleFirebaseError = (error) => {
  if (error.code) {
    return getAuthErrorMessage(error.code);
  }
  return error.message || 'An unexpected error occurred.';
};
