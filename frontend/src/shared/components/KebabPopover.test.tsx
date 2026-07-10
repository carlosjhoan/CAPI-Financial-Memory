import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import KebabPopover from './KebabPopover';
import type { KebabAction } from './KebabPopover';

describe('KebabPopover', () => {
  const actions: KebabAction[] = [
    { label: 'Editar', onClick: vi.fn() },
    { label: 'Eliminar', onClick: vi.fn(), danger: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the kebab button', () => {
    render(<KebabPopover actions={actions} />);
    const btn = screen.getByRole('button', { name: /acciones/i });
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open the popover on button click', () => {
    render(<KebabPopover actions={actions} />);
    const btn = screen.getByRole('button', { name: /acciones/i });

    fireEvent.click(btn);

    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('should close the popover on second button click', () => {
    render(<KebabPopover actions={actions} />);
    const btn = screen.getByRole('button', { name: /acciones/i });

    fireEvent.click(btn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should call action onClick and close popover when menu item is clicked', () => {
    const onClick = vi.fn();
    render(<KebabPopover actions={[{ label: 'Editar', onClick }]} />);
    const btn = screen.getByRole('button', { name: /acciones/i });

    fireEvent.click(btn);
    fireEvent.click(screen.getByText('Editar'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    render(<KebabPopover actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // The escape handler is on document, fire on document
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should render action with danger class when danger is true', () => {
    render(<KebabPopover actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }));

    const eliminarBtn = screen.getByText('Eliminar');
    expect(eliminarBtn.className).toContain('text-red');
  });
});