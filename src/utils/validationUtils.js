// Validation utilities
export const validators = {
  required: (value) => ({
    isValid: value !== undefined && value !== null && String(value).trim() !== '',
    message: 'This field is required'
  }),
  
  minLength: (min) => (value) => ({
    isValid: String(value).length >= min,
    message: `Must be at least ${min} characters`
  }),
  
  maxLength: (max) => (value) => ({
    isValid: String(value).length <= max,
    message: `Must not exceed ${max} characters`
  }),
  
  email: (value) => ({
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
    message: 'Please enter a valid email address'
  }),
  
  number: (value) => ({
    isValid: !isNaN(parseFloat(value)) && isFinite(value),
    message: 'Please enter a valid number'
  }),
  
  min: (min) => (value) => ({
    isValid: parseFloat(value) >= min,
    message: `Must be at least ${min}`
  }),
  
  max: (max) => (value) => ({
    isValid: parseFloat(value) <= max,
    message: `Must not exceed ${max}`
  }),
  
  date: (value) => ({
    isValid: !isNaN(Date.parse(value)),
    message: 'Please enter a valid date'
  }),
  
  futureDate: (value) => ({
    isValid: new Date(value) > new Date(),
    message: 'Date must be in the future'
  })
};

export const validateField = (value, validations) => {
  for (const validation of validations) {
    const result = validation(value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
};

export const validateForm = (data, schema) => {
  const errors = {};
  let isValid = true;
  
  for (const [field, validations] of Object.entries(schema)) {
    const value = data[field];
    const result = validateField(value, validations);
    if (!result.isValid) {
      errors[field] = result.message;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};