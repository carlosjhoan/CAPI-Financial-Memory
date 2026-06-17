import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import RecordFocusCard from './RecordFocusCard';

interface TestItem {
  id: string;
  label: string;
}

const TEST_ITEM: TestItem = { id: '1', label: 'Test Record' };

describe('RecordFocusCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with item and display content via renderDetail', () => {
    render(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
      />,
    );
    expect(screen.getByText('Test Record')).toBeInTheDocument();
  });

  it('should apply entry animation class by default', () => {
    const { container } = render(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
      />,
    );
    const body = container.querySelector('.focus-card-body');
    expect(body).toBeInTheDocument();
    expect(body?.classList.contains('focus-card-enter')).toBe(true);
    expect(body?.classList.contains('focus-card-exit')).toBe(false);
  });

  it('should apply exit animation class when isExiting is true', () => {
    const { container, rerender } = render(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
        isExiting={false}
      />,
    );

    // Re-render with isExiting=true
    rerender(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
        isExiting={true}
      />,
    );

    const body = container.querySelector('.focus-card-body');
    expect(body?.classList.contains('focus-card-exit')).toBe(true);
    expect(body?.classList.contains('focus-card-enter')).toBe(false);
  });

  it('should call onDismiss after 300ms when isExiting becomes true', () => {
    const onDismiss = vi.fn();

    const { rerender } = render(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
        isExiting={false}
        onDismiss={onDismiss}
      />,
    );

    rerender(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
        isExiting={true}
        onDismiss={onDismiss}
      />,
    );

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not crash when onDismiss is undefined and isExiting becomes true', () => {
    const { rerender } = render(
      <RecordFocusCard
        item={TEST_ITEM}
        renderDetail={(item) => <span>{item.label}</span>}
        isExiting={false}
      />,
    );

    expect(() => {
      rerender(
        <RecordFocusCard
          item={TEST_ITEM}
          renderDetail={(item) => <span>{item.label}</span>}
          isExiting={true}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(300);
      });
    }).not.toThrow();
  });
});
