// ponytail: flip behavior test is environment-dependent (jsdom has no real viewport).
// This verifies the flip logic doesn't crash. Full flip coverage needs e2e/browser tests.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KebabPopover from './KebabPopover';
import type { KebabAction } from './KebabPopover';

describe('KebabPopover flip behavior', () => {
  const actions: KebabAction[] = [
    { label: 'Editar', onClick: vi.fn() },
    { label: 'Eliminar', onClick: vi.fn(), danger: true },
  ];

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render popover without crashing regardless of button position', () => {
    render(
      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
        <KebabPopover actions={actions} />
      </div>,
    );

    const btn = screen.getByRole('button', { name: /acciones/i });
    fireEvent.click(btn);

    // The popover should appear in the portal
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    // Since we're in jsdom (no real viewport), position values are computed
    // but the menu still renders
    expect(menu.style.top).toBeTruthy();
    expect(menu.style.left).toBeTruthy();
  });
});