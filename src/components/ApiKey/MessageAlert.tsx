import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface MessageAlertProps {
  type: 'error' | 'success';
  message: string;
  onDismiss: () => void;
}

export default function MessageAlert({ type, message, onDismiss }: MessageAlertProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-400',
      button: 'text-red-600 hover:text-red-800'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400',
      button: 'text-green-600 hover:text-green-800'
    }
  };

  const style = styles[type];
  const Icon = type === 'error' ? AlertCircle : Check;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex items-start`}>
      <Icon className={`h-5 w-5 ${style.icon} mt-0.5 mr-3 flex-shrink-0`} />
      <div>
        <p className={style.text}>{message}</p>
        <button
          onClick={onDismiss}
          className={`${style.button} text-sm mt-1`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}