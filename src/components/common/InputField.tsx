// src/components/common/InputField.tsx
// Input reutilizable con label, error y ícono

import { type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './InputField.module.css';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label:      string;
  error?:     string;
  leftIcon?:  ReactNode;
  rightIcon?: ReactNode;
  hint?:      string;
}

export function InputField({
  label,
  error,
  leftIcon,
  rightIcon,
  hint,
  id,
  className = '',
  ...props
}: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={[styles.field, error ? styles.hasError : '', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={inputId}
          className={[styles.input, leftIcon ? styles.withLeftIcon : '', rightIcon ? styles.withRightIcon : ''].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
