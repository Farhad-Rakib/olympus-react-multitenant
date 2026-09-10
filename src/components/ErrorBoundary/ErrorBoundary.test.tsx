import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = () => {
  throw new Error('kaboom');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors to console.error; silenced so a passing run stays readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>all good</p></ErrorBoundary>);
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('renders the fallback UI instead of unmounting the tree', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);

    // The point of the boundary: the user sees something actionable, not a blank page.
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('prefers a caller-supplied fallback', () => {
    render(
      <ErrorBoundary fallback={<p>inline fallback</p>}>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('inline fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('reports the error so it is not swallowed silently', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);

    const reported = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls
      .some(args => args.some((arg: unknown) => arg instanceof Error && arg.message === 'kaboom'));

    expect(reported).toBe(true);
  });
});
