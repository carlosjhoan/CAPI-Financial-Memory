import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebts } from '../features/debts/hooks/useDebts';
import { useMonthlySummary as useIncomesMonthlySummary } from '../features/incomes/hooks/useIncomes';
import { useMonthlySummary as useExpensesMonthlySummary } from '../features/expenses/hooks/useExpenses';
import { useOverallSummary as useLoansOverallSummary } from '../features/loans/hooks/useLoans';
import { usePocketsSummary } from '../features/pockets/hooks/usePockets';
import { useLocalStorage } from '../core/hooks/useLocalStorage';
import CountUpNumber from '../shared/components/CountUpNumber';

interface DashboardCard {
  id: string;
  type: 'debts' | 'expenses' | 'incomes' | 'balance' | 'loans' | 'pockets';
  title: string;
  amount: string;
  subtitle: string;
  color: string;
  darkColor: string;
  route: string;
}

const DEFAULT_CARDS: DashboardCard[] = [
  {
    id: 'debts',
    type: 'debts',
    title: 'Deudas Totales',
    amount: '$0.00',
    subtitle: 'Sin deudas registradas',
    color: 'red',
    darkColor: 'red',
    route: '/debts',
  },
  {
    id: 'expenses',
    type: 'expenses',
    title: 'Gastos del Mes',
    amount: '$0.00',
    subtitle: 'Sin gastos registrados',
    color: 'orange',
    darkColor: 'orange',
    route: '/expenses',
  },
  {
    id: 'incomes',
    type: 'incomes',
    title: 'Ingresos del Mes',
    amount: '',
    subtitle: 'Sin ingresos registrados',
    color: 'green',
    darkColor: 'green',
    route: '/incomes',
  },
  {
    id: 'loans',
    type: 'loans',
    title: 'Préstamos Activos',
    amount: '$0.00',
    subtitle: 'Sin préstamos registrados',
    color: 'blue',
    darkColor: 'blue',
    route: '/loans',
  },
  {
    id: 'pockets',
    type: 'pockets',
    title: 'Bolsillos',
    amount: '$0.00',
    subtitle: 'Sin bolsillos registrados',
    color: 'purple',
    darkColor: 'purple',
    route: '/pockets',
  },
  {
    id: 'balance',
    type: 'balance',
    title: 'Balance',
    amount: '$0.00',
    subtitle: 'Ingresos - Gastos',
    color: 'blue',
    darkColor: 'blue',
    route: '/savings',
  },
];

/* ───────── SVG icon mapping ───────── */
const CARD_ICONS: Record<string, JSX.Element> = {
  incomes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  debts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  ),
  expenses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0-6-6m6 6 6-6" />
    </svg>
  ),
  loans: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  pockets: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  ),
  balance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
};

/* ───────── Color utility maps ───────── */
const COLOR_BAR_MAP: Record<string, string> = {
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  green: 'bg-green-500 dark:bg-green-400',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-purple-500 dark:bg-purple-400',
};

const COLOR_BG_MAP: Record<string, string> = {
  red: 'bg-red-50 dark:bg-red-900/10',
  orange: 'bg-orange-50 dark:bg-orange-900/10',
  green: 'bg-green-50 dark:bg-green-900/10',
  blue: 'bg-blue-50 dark:bg-blue-900/10',
  purple: 'bg-purple-50 dark:bg-purple-900/10',
};

const COLOR_TEXT_MAP: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
};

const COLOR_RING_MAP: Record<string, string> = {
  red: 'hover:ring-red-300 dark:hover:ring-red-600',
  orange: 'hover:ring-orange-300 dark:hover:ring-orange-600',
  green: 'hover:ring-green-300 dark:hover:ring-green-600',
  blue: 'hover:ring-blue-300 dark:hover:ring-blue-600',
  purple: 'hover:ring-purple-300 dark:hover:ring-purple-600',
};

/**
 * Convierte un string de monto (ej: "$1,234.56") a número
 * Maneja el formato colombiano con separador de miles (.) y decimal (,)
 */
const parseNumberFromAmount = (amount: string): number => {
  if (!amount || amount === '—') return 0;
  // Eliminar el símbolo $ y espacios
  let cleaned = amount.replace(/\$\s*/g, '');
  // En formato CO: 1.234,56 -> convertir a 1234.56
  // Primero eliminar los puntos de miles
  cleaned = cleaned.replace(/\./g, '');
  // Luego cambiar coma decimal por punto
  cleaned = cleaned.replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: debts } = useDebts();
  const { data: monthlyIncomeSummary } = useIncomesMonthlySummary();
  const { data: monthlyExpenseSummary } = useExpensesMonthlySummary();
  const { data: loansOverallSummary } = useLoansOverallSummary();
  const { data: pocketsSummary } = usePocketsSummary();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [incomeCount, setIncomeCount] = useState<number>(0);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [expenseCount, setExpenseCount] = useState<number>(0);

  // Always include all 6 cards, preserve order from localStorage if valid
  const getInitialCardOrder = (): string[] => {
    const savedOrder = localStorage.getItem('dashboard-card-order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const allIds = DEFAULT_CARDS.map(c => c.id);
        const hasAll = allIds.every(id => parsed.includes(id));
        if (hasAll && parsed.length === 6) {
          return parsed;
        }
      } catch {
        // Invalid, use default
      }
    }
    return DEFAULT_CARDS.map(c => c.id);
  };

  const initialOrder = getInitialCardOrder();
  const [cardOrder, setCardOrder] = useLocalStorage<string[]>('dashboard-card-order', initialOrder);

  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Calcular total de deudas
  const totalDebts = debts?.reduce((sum, debt) => sum + Math.max(0, debt.finalAmount - debt.paidAmount), 0) || 0;
  const debtCount = debts?.length || 0;

  // Obtener datos del resumen mensual de ingresos
  useEffect(() => {
    if (monthlyIncomeSummary) {
      const total = typeof monthlyIncomeSummary.totalAmount === 'number'
        ? monthlyIncomeSummary.totalAmount
        : parseFloat(String(monthlyIncomeSummary.totalAmount)) || 0;
      setMonthlyIncome(total);
      setIncomeCount(monthlyIncomeSummary.incomeCount);
    } else {
      setMonthlyIncome(0);
      setIncomeCount(0);
    }
  }, [monthlyIncomeSummary]);

  // Obtener datos del resumen mensual de gastos
  useEffect(() => {
    if (monthlyExpenseSummary) {
      const total = typeof monthlyExpenseSummary.totalAmount === 'number'
        ? monthlyExpenseSummary.totalAmount
        : parseFloat(String(monthlyExpenseSummary.totalAmount)) || 0;
      setMonthlyExpense(total);
      setExpenseCount(monthlyExpenseSummary.expenseCount);
    } else {
      setMonthlyExpense(0);
      setExpenseCount(0);
    }
  }, [monthlyExpenseSummary]);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    dragItem.current = cardId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (_e: React.DragEvent, cardId: string) => {
    dragOverItem.current = cardId;
  };

  const handleDragEnd = () => {
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
      const newOrder = [...cardOrder];
      const dragIndex = newOrder.indexOf(dragItem.current);
      const dropIndex = newOrder.indexOf(dragOverItem.current);

      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, dragItem.current);

      setCardOrder(newOrder);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const getCardsWithData = (): DashboardCard[] => {
    const cardsMap = new Map(DEFAULT_CARDS.map(card => [card.id, { ...card }]));

    // Actualizar datos de deudas
    if (debtCount > 0) {
      const debtsCard = cardsMap.get('debts');
      if (debtsCard) {
        debtsCard.amount = `$${totalDebts.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        debtsCard.subtitle = `${debtCount} deuda${debtCount !== 1 ? 's' : ''} registrada${debtCount !== 1 ? 's' : ''}`;
      }
    }

    // Actualizar datos de préstamos
    if (loansOverallSummary) {
      const loansCard = cardsMap.get('loans');
      if (loansCard) {
        loansCard.amount = `$${loansOverallSummary.totalPending.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        loansCard.subtitle = `${loansOverallSummary.activeLoansCount} préstamo${loansOverallSummary.activeLoansCount !== 1 ? 's' : ''} activo${loansOverallSummary.activeLoansCount !== 1 ? 's' : ''}`;
      }
    }

    // Actualizar datos de ingresos (siempre, incluso si es 0)
    const incomesCard = cardsMap.get('incomes');
    if (incomesCard) {
      incomesCard.amount = `$${monthlyIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
      incomesCard.subtitle = `${incomeCount} ingreso${incomeCount !== 1 ? 's' : ''} registrado${incomeCount !== 1 ? 's' : ''}`;
    }

    // Actualizar datos de gastos
    const expensesCard = cardsMap.get('expenses');
    if (expensesCard) {
      expensesCard.amount = `$${monthlyExpense.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
      expensesCard.subtitle = `${expenseCount} gasto${expenseCount !== 1 ? 's' : ''} registrado${expenseCount !== 1 ? 's' : ''}`;
    }

    // Actualizar datos de bolsillos
    if (pocketsSummary) {
      const pocketsCard = cardsMap.get('pockets');
      if (pocketsCard) {
        pocketsCard.amount = `$${pocketsSummary.totalAccumulated.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        pocketsCard.subtitle = `${pocketsSummary.count} bolsillo${pocketsSummary.count !== 1 ? 's' : ''}`;
      }
    }

    // Calcular balance (Ingresos - Gastos - Deudas + Préstamos)
    const balanceCard = cardsMap.get('balance');
    if (balanceCard && incomesCard) {
      const loansPending = loansOverallSummary?.totalPending ?? 0;
      const balance = monthlyIncome - monthlyExpense - totalDebts + loansPending;
      balanceCard.amount = `$${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
    }

    return cardOrder.map(id => cardsMap.get(id)).filter(Boolean) as DashboardCard[];
  };

  const renderCard = (card: DashboardCard) => {
    const isDragging = dragItem.current === card.id;
    const icon = CARD_ICONS[card.type];

    return (
      <div
        key={card.id}
        draggable
        onDragStart={(e) => handleDragStart(e, card.id)}
        onDragEnter={(e) => handleDragEnter(e, card.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => e.preventDefault()}
        className={`
          bg-white dark:bg-secondary-800 rounded-lg shadow cursor-pointer
          hover:shadow-lg hover:ring-2 ${COLOR_RING_MAP[card.color] || 'hover:ring-gray-300'}
          transition-all duration-200 overflow-hidden group
          ${isDragging ? 'opacity-50' : ''}
        `}
        onClick={() => navigate(card.route)}
        title={`${card.title}: ${card.amount} - ${card.subtitle}`}
      >
        {/* ── Color bar ── */}
        <div className={`h-1 ${COLOR_BAR_MAP[card.color]}`} />

        <div className="p-2 text-center">
          {/* ── Icon ── */}
          <div className={`inline-block mb-1 ${COLOR_TEXT_MAP[card.color]} opacity-70 group-hover:opacity-100 transition-opacity`}>
            {icon}
          </div>

          {/* ── Amount with count-up animation ── */}
          <p className={`text-sm font-bold truncate ${COLOR_TEXT_MAP[card.color]}`}>
            {card.amount && card.amount !== '—' ? (
              <CountUpNumber
                value={parseNumberFromAmount(card.amount)}
                className=""
                decimals={2}
              />
            ) : (
              '—'
            )}
          </p>
        </div>

        {/* ── Title bar at bottom ── */}
        <div className={`h-6 flex items-center justify-center ${COLOR_BG_MAP[card.color]} rounded-b`}>
          <span className="text-[10px] font-bold truncate px-1 text-gray-700 dark:text-white">
            {card.title.split(' ')[0]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Dashboard Financiero</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {getCardsWithData().map(renderCard)}
      </div>
    </div>
  );
};

export default DashboardPage;
