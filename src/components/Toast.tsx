import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={18} color="#059669" />}
          {toast.type === 'error' && <AlertCircle size={18} color="#dc2626" />}
          {toast.type === 'info' && <Info size={18} color="#4f46e5" />}
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{toast.message}</span>
          <button className="btn-ghost btn-icon" onClick={() => onRemove(toast.id)} style={{ padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
