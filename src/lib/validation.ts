/**
 * Input validation utilities for forms
 * Returns true if valid, or error string if invalid
 */

export const validation = {
  // Phone validation (Nigerian format: +234XXXXXXXXXX or 0XXXXXXXXXX)
  phone: (phone: string): boolean | string => {
    const cleanPhone = phone.replace(/\s/g, '');
    const pattern = /^(\+234|0)[7-9]\d{9}$/;
    
    if (!phone) return 'Phone number is required';
    if (!pattern.test(cleanPhone)) {
      return 'Invalid Nigerian phone number format (e.g., +2347030123456)';
    }
    return true;
  },

  // Password validation
  password: (password: string): boolean | string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return true;
  },

  // Email validation (optional field)
  email: (email: string): boolean | string => {
    if (!email) return true; // Optional field
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(email)) return 'Invalid email format';
    return true;
  },

  // Full name validation
  fullName: (name: string): boolean | string => {
    if (!name) return 'Full name is required';
    const trimmed = name.trim();
    if (trimmed.length < 2) return 'Name is too short';
    if (trimmed.split(' ').length < 2) return 'Please enter your first and last name';
    if (trimmed.length > 50) return 'Name is too long';
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'Name contains invalid characters';
    return true;
  },

  // Amount validation (in kobo or naira)
  amount: (amount: number | string, currency: 'naira' | 'kobo' = 'naira'): boolean | string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!num || isNaN(num) || num <= 0) return 'Amount must be greater than 0';
    
    const maxAmount = currency === 'kobo' ? 1_000_000_000_00 : 1_000_000_000; // 1B naira max
    const minAmount = currency === 'kobo' ? 100 : 1; // 1 naira / 100 kobo min
    
    if (num < minAmount) return `Amount must be at least ${currency === 'kobo' ? '₦1' : '₦1'}`;
    if (num > maxAmount) return 'Amount is too large';
    if (!Number.isFinite(num)) return 'Invalid amount';
    return true;
  },

  // Budget limit validation
  budgetLimit: (limit: number | string): boolean | string => {
    const num = typeof limit === 'string' ? parseFloat(limit) : limit;
    if (!num || isNaN(num) || num < 100) return 'Budget must be at least ₦100';
    if (num > 100_000_000) return 'Budget limit is too high (max ₦100M)';
    if (!Number.isFinite(num)) return 'Invalid budget amount';
    return true;
  },

  // Date range validation
  dateRange: (startDate: string, endDate: string): boolean | string => {
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) return 'Invalid start date';
    if (isNaN(end.getTime())) return 'Invalid end date';
    if (start >= end) return 'Start date must be before end date';
    
    // Check reasonable date range (not more than 5 years)
    const diffYears = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (diffYears > 5) return 'Date range cannot exceed 5 years';
    
    return true;
  },

  // OTP code validation
  otp: (code: string): boolean | string => {
    if (!code) return 'OTP is required';
    if (!/^\d{6}$/.test(code)) return 'OTP must be exactly 6 digits';
    return true;
  },

  // Category name validation
  categoryName: (name: string): boolean | string => {
    if (!name) return 'Category name is required';
    const trimmed = name.trim();
    if (trimmed.length < 2) return 'Category name is too short';
    if (trimmed.length > 30) return 'Category name is too long';
    if (!/^[a-zA-Z0-9\s&-]+$/.test(trimmed)) return 'Category name contains invalid characters';
    return true;
  },

  // Search query validation
  searchQuery: (query: string): boolean | string => {
    if (!query) return true; // Optional field
    const trimmed = query.trim();
    if (trimmed.length < 2) return 'Search query must be at least 2 characters';
    if (trimmed.length > 100) return 'Search query is too long';
    return true;
  },

  // Required field validation
  required: (value: any, fieldName: string = 'Field'): boolean | string => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required`;
    }
    return true;
  },

  // Plan validation
  plan: (planSlug: string): boolean | string => {
    const validPlans = ['FREE', 'PRO', 'PREMIUM'];
    if (!planSlug) return 'Plan selection is required';
    if (!validPlans.includes(planSlug.toUpperCase())) {
      return 'Invalid plan selected';
    }
    return true;
  },

  // Subscription interval validation
  interval: (interval: string): boolean | string => {
    const validIntervals = ['MONTHLY', 'ANNUALLY'];
    if (!interval) return 'Billing interval is required';
    if (!validIntervals.includes(interval.toUpperCase())) {
      return 'Invalid billing interval';
    }
    return true;
  },

  // Export format validation
  exportFormat: (format: string): boolean | string => {
    const validFormats = ['PDF', 'EXCEL'];
    if (!format) return 'Export format is required';
    if (!validFormats.includes(format.toUpperCase())) {
      return 'Invalid export format';
    }
    return true;
  },
};

/**
 * Validate multiple fields at once
 * Returns an object with field names as keys and error messages as values
 */
export const validateFields = (fields: Record<string, any>, rules: Record<string, (value: any) => boolean | string>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(rules).forEach(([fieldName, validator]) => {
    const value = fields[fieldName];
    const result = validator(value);
    if (result !== true) {
      errors[fieldName] = result;
    }
  });
  
  return errors;
};

/**
 * Check if validation errors object is empty (no errors)
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};