import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from './Navigation';

describe('Navigation', () => {
  const mockLenis = {
    scrollTo: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('scrollY', 0);
    window.addEventListener = vi.fn((event, handler) => {
      if (event === 'scroll') {
        (window as any)._scrollHandler = handler;
      }
    });
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders nav links', () => {
    render(<Navigation lenis={null} />);
    expect(screen.getAllByText('Events').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('RSVP').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Travel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('FAQ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gallery').length).toBeGreaterThanOrEqual(1);
  });

  it('hides FAQ nav link when faqVisible is false', () => {
    render(<Navigation lenis={null} faqVisible={false} />);
    expect(screen.queryAllByText('FAQ').length).toBe(0);
    expect(screen.getAllByText('Gallery').length).toBeGreaterThanOrEqual(1);
  });

  it('hides Gallery nav link when galleryVisible is false', () => {
    render(<Navigation lenis={null} galleryVisible={false} />);
    expect(screen.getAllByText('FAQ').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText('Gallery').length).toBe(0);
  });

  it('hides both FAQ and Gallery nav links when both are false', () => {
    render(<Navigation lenis={null} faqVisible={false} galleryVisible={false} />);
    expect(screen.queryAllByText('FAQ').length).toBe(0);
    expect(screen.queryAllByText('Gallery').length).toBe(0);
    expect(screen.getAllByText('Events').length).toBeGreaterThanOrEqual(1);
  });

  it('renders A&A home button', () => {
    render(<Navigation lenis={null} />);
    expect(screen.getByText('A&A')).toBeInTheDocument();
  });

  it('opens mobile menu when hamburger is clicked', () => {
    render(<Navigation lenis={null} />);

    fireEvent.click(screen.getByLabelText('Open menu'));

    // Mobile overlay becomes visible
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes mobile menu when close button is clicked', () => {
    render(<Navigation lenis={null} />);

    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close menu'));
    // Close button is still in DOM (overlay is opacity-0), but menu is functionally closed
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('calls lenis.scrollTo on nav click', async () => {
    render(<Navigation lenis={mockLenis as any} />);

    fireEvent.click(screen.getAllByText('RSVP')[0]);

    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(mockLenis.scrollTo).toHaveBeenCalledWith('#rsvp', { offset: -48 });
    });
  });

  it('calls lenis.stop when mobile menu opens', () => {
    render(<Navigation lenis={mockLenis as any} />);

    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(mockLenis.stop).toHaveBeenCalled();
  });

  it('calls lenis.start when mobile menu closes', () => {
    render(<Navigation lenis={mockLenis as any} />);

    fireEvent.click(screen.getByLabelText('Open menu'));
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(mockLenis.start).toHaveBeenCalled();
  });
});
