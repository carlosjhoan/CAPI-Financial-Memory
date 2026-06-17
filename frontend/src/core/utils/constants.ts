// Constantes de la aplicación

export const APP_CONSTANTS = {
  // Configuración de API
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3,
  },

  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    PAGE_SIZES: [10, 25, 50, 100],
  },

  // Configuración de debouncing
  DEBOUNCE: {
    SEARCH: 300, // 300ms para búsquedas
    FILTERS: 300, // 300ms para filtros
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    DEFAULT_DURATION: 5000, // 5 segundos
    SUCCESS_DURATION: 3000, // 3 segundos
    ERROR_DURATION: 7000, // 7 segundos
  },

  // Configuración de fechas
  DATES: {
    DATE_FORMAT: 'YYYY-MM-DD',
    DATE_TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
    DISPLAY_DATE_TIME_FORMAT: 'DD/MM/YYYY HH:mm',
  },

  // Configuración de moneda
  CURRENCY: {
    DEFAULT: 'COP',
    SYMBOL: '$',
    DECIMALS: 2,
  },

  // Configuración de validación
  VALIDATION: {
    MAX_REASON_LENGTH: 255,
    MAX_AMOUNT: 9999999.99,
    MIN_AMOUNT: 0.01,
  },

  // Configuración de temas
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    DIM: 'dim',
    DEFAULT: 'dark', // Default to 'dark' to match useTheme default
  },

  // Configuración de localStorage keys
  STORAGE_KEYS: {
    THEME: 'theme', // Must match useTheme hook storage key
    LANGUAGE: 'app-language',
    USER_PREFERENCES: 'user-preferences',
  },
};

// Opciones para selects
export const SELECT_OPTIONS = {
  MONTHS: [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ],

  YEARS: (() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  })(),

  CURRENCIES: [
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dólar ($)' },
    { value: 'COP', label: 'Peso Colombiano ($)' },
  ],
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  SERVER: 'Error del servidor. Por favor, intenta nuevamente más tarde.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  UNAUTHORIZED: 'No tienes permiso para realizar esta acción.',
  VALIDATION: 'Por favor, corrige los errores en el formulario.',
  UNKNOWN: 'Ha ocurrido un error inesperado.',
};

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  CREATED: 'Registro creado exitosamente.',
  UPDATED: 'Registro actualizado exitosamente.',
  DELETED: 'Registro eliminado exitosamente.',
  SAVED: 'Cambios guardados exitosamente.',
};

// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  INCOMES: {
    LIST: '/incomes',
    CREATE: '/incomes/create',
    DETAIL: (id: string) => `/incomes/${id}`,
    EDIT: (id: string) => `/incomes/${id}/edit`,
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses/create',
    DETAIL: (id: string) => `/expenses/${id}`,
  },
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
};