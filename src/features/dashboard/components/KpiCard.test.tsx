import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('renders the label, value, and icon', () => {
    const { container } = render(<KpiCard label="Total Users" value="1,240" icon={Users} />);

    expect(screen.getByRole('heading', { name: 'Total Users' })).toBeInTheDocument();
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
