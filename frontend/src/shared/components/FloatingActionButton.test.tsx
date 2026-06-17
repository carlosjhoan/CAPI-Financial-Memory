import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FloatingActionButton from './FloatingActionButton';

describe('FloatingActionButton', () => {
  it('renders a button with label as aria-label', () => {
    render(<FloatingActionButton onClick={() => {}} label="Nuevo" />);
    const button = screen.getByRole('button', { name: 'Nuevo' });
    expect(button).toBeInTheDocument();
  });

  it('renders label text inside the tooltip', () => {
    render(<FloatingActionButton onClick={() => {}} label="Agregar Ingreso" />);
    expect(screen.getByText('Agregar Ingreso')).toBeInTheDocument();
  });

  it('applies vitral radial-gradient edge-intense background for green accentColor', () => {
    const { container } = render(
      <FloatingActionButton onClick={() => {}} label="Test" accentColor="green" />,
    );
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    const style = button!.getAttribute('style') || '';
    expect(style).toContain('background-image');
    expect(style).toContain('radial-gradient');
    expect(style).toContain('rgba(74,222,128');
  });

  it('renders with all accent colors without error', () => {
    const colors = ['green', 'orange', 'red', 'blue', 'purple', 'primary'] as const;
    for (const color of colors) {
      const { container } = render(
        <FloatingActionButton onClick={() => {}} label="Test" accentColor={color} />,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    }
  });
});
