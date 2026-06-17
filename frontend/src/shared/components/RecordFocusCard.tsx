import React, { useEffect, useRef } from 'react';
import './RecordFocusCard.css';

// ==========================================
// TYPES
// ==========================================

export interface RecordFocusCardProps<T> {
  /** The item to display in the card */
  item: T;
  /** Slot to render the detail content for the item */
  renderDetail: (item: T) => React.ReactNode;
  /** When true, plays exit animation and calls onDismiss after 300ms */
  isExiting?: boolean;
  /** Called after exit animation completes (300ms after isExiting becomes true) */
  onDismiss?: () => void;
  /** Month name context — shown as a mini-header to connect card with timeline */
  monthName?: string;
  /** Year context — shown alongside monthName */
  year?: number;
}

// ==========================================
// COMPONENT
// ==========================================

function RecordFocusCard<T>({
  item,
  renderDetail,
  isExiting = false,
  onDismiss,
  monthName,
  year,
}: RecordFocusCardProps<T>) {
  const animClass = isExiting ? 'focus-card-exit' : 'focus-card-enter';

  // When isExiting becomes true, call onDismiss after exit animation (300ms)
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!isExiting) return;

    const timer = setTimeout(() => {
      onDismissRef.current?.();
    }, 300);

    return () => clearTimeout(timer);
  }, [isExiting]);

  return (
    <div className="record-focus-card">
      {/* Mini-header: mes · año — conecta visualmente el card con el timeline header */}
      {monthName && year !== undefined && (
        <div className="focus-card-month">
          <span className="focus-card-month-text">
            {monthName.toUpperCase()} · {year}
          </span>
        </div>
      )}
      <div className={`focus-card-body ${animClass}`}>
        {renderDetail(item)}
      </div>
    </div>
  );
}

export default React.memo(RecordFocusCard as typeof RecordFocusCard) as typeof RecordFocusCard;
