import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Icon } from '@iconify/react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const timerRef = useRef(null);
  const onCloseRef = useRef(null);

  const hideNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification((n) => ({ ...n, show: false }));
    const cb = onCloseRef.current;
    onCloseRef.current = null;
    if (typeof cb === 'function') cb();
  }, []);

  const showNotification = useCallback((message, type = 'success', onClose = null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onCloseRef.current = typeof onClose === 'function' ? onClose : null;
    setNotification({ show: true, message, type });
    timerRef.current = setTimeout(hideNotification, 2500);
  }, [hideNotification]);

  const iconMap = { success: 'mdi:check-circle', error: 'mdi:alert-circle', info: 'mdi:information' };
  const bgMap = { success: 'bg-green-50 border-green-200', error: 'bg-red-50 border-red-200', info: 'bg-blue-50 border-blue-200' };
  const iconColorMap = { success: 'text-green-600', error: 'text-red-600', info: 'text-blue-600' };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={hideNotification}>
          <div
            className={`rounded-2xl shadow-elevated border border-gray-100 p-6 max-w-sm w-full ${bgMap[notification.type] || bgMap.success}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <Icon icon={iconMap[notification.type] || iconMap.success} className={`text-4xl ${iconColorMap[notification.type] || iconColorMap.success}`} />
              <p className="text-gray-800 font-medium flex-1">{notification.message}</p>
            </div>
            <button
              onClick={hideNotification}
              className="mt-4 w-full py-2.5 px-4 bg-oa-green hover:bg-oa-green-dark text-white rounded-lg font-medium shadow-sm transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
