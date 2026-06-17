import { useToastContext } from '../contexts';

// Hook global para usar en toda la aplicación
// Este hook accederá al contexto global de Toast implementado con React Context
export const useGlobalToast = () => {
  const { success, error, warning, info, toasts, removeToast } = useToastContext();
  
  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  };
};