"use client";

import { useState, useCallback } from "react";

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null; // return error message or null
};

export type FieldConfig = Record<string, ValidationRule>;

export type FieldErrors = Record<string, string>;
export type FieldTouched = Record<string, boolean>;

export function useFormValidation(config: FieldConfig) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});

  const validateField = useCallback(
    (name: string, value: string): string | null => {
      const rules = config[name];
      if (!rules) return null;

      const trimmed = value.trim();

      if (rules.required && !trimmed) {
        return "This field is required";
      }

      if (rules.minLength && trimmed.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && trimmed.length > rules.maxLength) {
        return `Must be no more than ${rules.maxLength} characters`;
      }

      if (rules.pattern && !rules.pattern.test(trimmed)) {
        return "Invalid format";
      }

      if (rules.custom) {
        return rules.custom(value);
      }

      return null;
    },
    [config]
  );

  const handleBlur = useCallback(
    (name: string, value: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[name] = error;
        } else {
          delete next[name];
        }
        return next;
      });
    },
    [validateField]
  );

  const validateAll = useCallback(
    (values: Record<string, string>): boolean => {
      const newErrors: FieldErrors = {};
      const newTouched: FieldTouched = {};

      for (const name of Object.keys(config)) {
        newTouched[name] = true;
        const error = validateField(name, values[name] || "");
        if (error) {
          newErrors[name] = error;
        }
      }

      setErrors(newErrors);
      setTouched(newTouched);
      return Object.keys(newErrors).length === 0;
    },
    [config, validateField]
  );

  const isValid = Object.keys(errors).length === 0 &&
    Object.keys(config).every((name) => touched[name]);

  const getFieldState = useCallback(
    (name: string) => {
      const isTouched = touched[name] || false;
      const error = errors[name] || null;
      const valid = isTouched && !error;
      return { isTouched, error, valid };
    },
    [errors, touched]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    handleBlur,
    validateField,
    validateAll,
    isValid,
    getFieldState,
    resetValidation,
  };
}
