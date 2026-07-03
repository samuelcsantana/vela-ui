import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('merges a custom className with the default styles', () => {
    render(<Card className="custom-class">content</Card>);
    expect(screen.getByText('content')).toHaveClass('custom-class', 'rounded-xl');
  });
});

describe('CardHeader', () => {
  it('renders its children', () => {
    render(<CardHeader>header content</CardHeader>);
    expect(screen.getByText('header content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders its children as a heading', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders its children', () => {
    render(<CardContent>body content</CardContent>);
    expect(screen.getByText('body content')).toBeInTheDocument();
  });
});
