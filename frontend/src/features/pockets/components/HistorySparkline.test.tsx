import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import HistorySparkline, { buildHistoryDataPoints } from './HistorySparkline';
import type { Pocket } from '../types/pocket.types';

// Cleanup after each component test to prevent DOM leakage
afterEach(() => {
  cleanup();
});

// ── Helpers ──

function createMockPocket(overrides: Partial<Pocket> = {}): Pocket {
  return {
    id: 'test-1',
    name: 'Test Pocket',
    type: 'deposit',
    goal: 0,
    initialAmount: 0,
    accumulatedAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    motivation: 'Test motivation',
    incomes: [],
    expenses: [],
    transfers: [],
    ...overrides,
  };
}

// ── Change 1: Today Extension (pure function tests) ──

describe('buildHistoryDataPoints — today extension', () => {
  it('appends virtual today point when last movement is yesterday', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pocket = createMockPocket({
      createdAt: thirtyDaysAgo.toISOString(),
      incomes: [{
        id: 'd1', amount: 10000,
        date: twoDaysAgo.toISOString(),
        createdAt: twoDaysAgo.toISOString(),
      }],
    });

    const points = buildHistoryDataPoints(pocket, false);
    // creation + yesterday + today = 3 points
    expect(points.length).toBe(3);
    expect(points[2].date.toDateString()).toBe(new Date().toDateString());
    expect(points[2].movements).toEqual([]);
    expect(points[2].value).toBe(points[1].value); // flat line
  });

  it('does NOT duplicate when last movement IS today', () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pocket = createMockPocket({
      createdAt: thirtyDaysAgo.toISOString(),
      incomes: [{
        id: 'd1', amount: 10000,
        date: today.toISOString(),
        createdAt: today.toISOString(),
      }],
    });

    const points = buildHistoryDataPoints(pocket, false);
    // creation + today = 2 points (no duplicate)
    expect(points.length).toBe(2);
    expect(points[1].date.toDateString()).toBe(today.toDateString());
  });

  it('returns single point when no movements, creation IS today, and no initial amount', () => {
    const pocket = createMockPocket({ createdAt: new Date().toISOString() });
    const points = buildHistoryDataPoints(pocket, false);
    expect(points.length).toBe(1);
    expect(points[0].movements).toEqual([]);
  });

  it('shows 2 points when created today with initial amount > 0 and no movements', () => {
    const pocket = createMockPocket({
      createdAt: new Date().toISOString(),
      initialAmount: 10000,
    });
    const points = buildHistoryDataPoints(pocket, false);
    expect(points.length).toBe(2);
    expect(points[0].value).toBe(10000);
    expect(points[1].value).toBe(10000); // flat line
    expect(points[1].date.toDateString()).toBe(new Date().toDateString());
  });

  it('handles no-movements with creation yesterday → adds today point', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pocket = createMockPocket({ createdAt: yesterday.toISOString() });
    const points = buildHistoryDataPoints(pocket, false);
    // creation + today = 2 points
    expect(points.length).toBe(2);
    expect(points[1].date.toDateString()).toBe(new Date().toDateString());
    expect(points[1].value).toBe(points[0].value); // flat
  });

  it('adds today point correctly after multiple daily movements', () => {
    const day1 = new Date();
    day1.setDate(day1.getDate() - 5);
    const day2 = new Date();
    day2.setDate(day2.getDate() - 3);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pocket = createMockPocket({
      createdAt: thirtyDaysAgo.toISOString(),
      incomes: [
        { id: 'd1', amount: 5000, date: day1.toISOString(), createdAt: day1.toISOString() },
        { id: 'd2', amount: 3000, date: day2.toISOString(), createdAt: day2.toISOString() },
      ],
    });

    const points = buildHistoryDataPoints(pocket, false);
    // creation + day1 + day2 + today = 4 points
    expect(points.length).toBe(4);
    expect(points[3].date.toDateString()).toBe(new Date().toDateString());
    expect(points[3].value).toBe(points[2].value); // flat extension
  });
});

// ── Component rendering tests ──

describe('HistorySparkline component — Status display', () => {
  it('shows "Sin movimientos aún" when creation IS today and no data', () => {
    const pocket = createMockPocket({ createdAt: new Date().toISOString() });
    render(<HistorySparkline pocket={pocket} />);
    expect(screen.getByText('Sin movimientos aún')).toBeInTheDocument();
  });

  it('shows sparkline when last movement is yesterday', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pocket = createMockPocket({
      createdAt: thirtyDaysAgo.toISOString(),
      incomes: [{
        id: 'd1', amount: 10000,
        date: twoDaysAgo.toISOString(),
        createdAt: twoDaysAgo.toISOString(),
      }],
    });

    render(<HistorySparkline pocket={pocket} />);
    expect(screen.queryByText('Sin movimientos aún')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sparkline de acumulación')).toBeInTheDocument();
  });

  it('shows sparkline when movement IS today', () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pocket = createMockPocket({
      createdAt: thirtyDaysAgo.toISOString(),
      incomes: [{
        id: 'd1', amount: 10000,
        date: today.toISOString(),
        createdAt: today.toISOString(),
      }],
    });

    render(<HistorySparkline pocket={pocket} />);
    expect(screen.queryByText('Sin movimientos aún')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sparkline de acumulación')).toBeInTheDocument();
  });

  it('renders sparkline with multiple movements across days', () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 10);
    const d2 = new Date();
    d2.setDate(d2.getDate() - 7);
    const d3 = new Date();
    d3.setDate(d3.getDate() - 3);

    const pocket = createMockPocket({
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      incomes: [
        { id: 'd1', amount: 20000, date: d1.toISOString(), createdAt: d1.toISOString() },
        { id: 'd2', amount: 5000, date: d2.toISOString(), createdAt: d2.toISOString() },
        { id: 'd3', amount: 15000, date: d3.toISOString(), createdAt: d3.toISOString() },
      ],
    });

    render(<HistorySparkline pocket={pocket} />);
    expect(screen.queryByText('Sin movimientos aún')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sparkline de acumulación')).toBeInTheDocument();
  });

  it('renders with expenses data', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const pocket = createMockPocket({
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      expenses: [{
        id: 'e1', pocketId: 'test-1', amount: 5000,
        date: twoDaysAgo.toISOString(), createdAt: twoDaysAgo.toISOString(),
      }],
    });

    render(<HistorySparkline pocket={pocket} />);
    expect(screen.getByLabelText('Sparkline de acumulación')).toBeInTheDocument();
  });

  it('renders with transfer data', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const pocket = createMockPocket({
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      transfers: [{
        id: 't1', sourcePocketId: 'src', targetPocketId: 'test-1',
        amount: 10000, reason: 'Test transfer',
        date: twoDaysAgo.toISOString(), createdAt: twoDaysAgo.toISOString(),
        direction: 'incoming',
      }],
    });

    render(<HistorySparkline pocket={pocket} />);
    expect(screen.getByLabelText('Sparkline de acumulación')).toBeInTheDocument();
  });
});
