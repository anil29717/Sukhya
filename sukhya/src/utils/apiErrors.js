const DEFAULT_MESSAGES = {
  NETWORK: 'No internet connection. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  401: 'Incorrect email or password.',
  403: 'Your account has been suspended. Contact support.',
  409: 'An account with this email already exists.',
  500: 'Something went wrong on our end. Please try again.',
};

export const getApiErrorMessage = (err, overrides = {}) => {
  if (!err) return 'Something went wrong. Please try again.';

  const code = err.code ?? err.status;

  if (code === 'NETWORK' || err.message === 'Network request failed') {
    return overrides.NETWORK ?? DEFAULT_MESSAGES.NETWORK;
  }

  if (code === 'TIMEOUT' || err.name === 'AbortError') {
    return overrides.TIMEOUT ?? DEFAULT_MESSAGES.TIMEOUT;
  }

  if (overrides[code]) return overrides[code];
  if (DEFAULT_MESSAGES[code]) return DEFAULT_MESSAGES[code];

  return err.message || 'Something went wrong. Please try again.';
};

export const mapValidationErrors = (detail) => {
  if (!Array.isArray(detail)) return {};

  const fieldErrors = {};
  detail.forEach((item) => {
    if (!item?.loc || !item?.msg) return;
    const field = item.loc[item.loc.length - 1];
    if (typeof field === 'string') {
      fieldErrors[field] = item.msg;
    }
  });
  return fieldErrors;
};

export const applyValidationErrors = (detail, setError, fieldMap = {}) => {
  const errors = mapValidationErrors(detail);
  Object.entries(errors).forEach(([field, message]) => {
    const formField = fieldMap[field] ?? field;
    setError(formField, { type: 'server', message });
  });
  return errors;
};
