import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SplitPanelLayout from './SplitPanelLayout';

describe('SplitPanelLayout', () => {
  it('should render left and right panels across all viewport variants', () => {
    render(
      <SplitPanelLayout
        left={<div data-testid="left-panel">Left</div>}
        right={<div data-testid="right-panel">Right</div>}
      />,
    );

    // Content renders in all three viewport containers simultaneously
    expect(screen.getAllByTestId('left-panel')).toHaveLength(3);
    expect(screen.getAllByTestId('right-panel')).toHaveLength(1); // tablet mobile hide right
  });

  it('should show placeholder text on right when right is empty', () => {
    render(
      <SplitPanelLayout
        left={<div>Left</div>}
        right={null}
      />,
    );

    expect(screen.getByText(/seleccioná/i)).toBeInTheDocument();
  });

  // ponytail: viewport-specific rendering uses CSS display classes (hidden/lg:flex etc.)
  // jsdom doesn't compute CSS visibility — all three containers are always in the DOM.
  // Testing responsive rendering requires a real browser (e2e).
});