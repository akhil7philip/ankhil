import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RSVPSection from './RSVPSection';

const mockInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ insert: mockInsert }) },
}));

vi.mock('gsap', () => ({
  default: {
    fromTo: vi.fn(),
  },
}));

vi.mock('@/components/ScrollReveal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RSVPSection', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders personal details fields', () => {
    render(<RSVPSection />);
    expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+91-XXXXXXXXXX')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Number of Guests *')).toBeInTheDocument();
    expect(screen.getByText('Dietary Preference *')).toBeInTheDocument();
  });

  it('renders city selection checkboxes', () => {
    render(<RSVPSection />);
    expect(screen.getByLabelText(/Kolkata celebrations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kerala reception/i)).toBeInTheDocument();
  });

  it('shows error when submitting without required fields', async () => {
    render(<RSVPSection />);

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter your full name/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter your phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select your dietary preference/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select at least one celebration/i)).toBeInTheDocument();
    });
  });

  it('shows Kolkata section when Kolkata checkbox is checked', async () => {
    render(<RSVPSection />);

    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));

    expect(screen.getByText(/Kolkata Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Events you'll attend/i)).toBeInTheDocument();
  });

  it('shows Kerala section when Kerala checkbox is checked', async () => {
    render(<RSVPSection />);

    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    expect(screen.getByText(/Kerala Details/i)).toBeInTheDocument();
  });

  it('requires at least one Kolkata event when attending Kolkata', async () => {
    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please select at least one Kolkata event/i)).toBeInTheDocument();
    });
  });

  it('submits successfully with valid data', async () => {
    mockInsert.mockResolvedValue({ data: null, error: null });

    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(screen.getByText(/Thank You!/i)).toBeInTheDocument();
    });

    const payload = mockInsert.mock.calls[0][0][0];
    expect(payload.full_name).toBe('Test User');
    expect(payload.phone).toBe('9999999999');
    expect(payload.dietary).toBe('veg');
    expect(payload.attending_kerala).toBe(true);
    expect(payload.attending_kolkata).toBe(false);
  });

  it('shows error banner when Supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'Network error' } });

    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  it('allows selecting dietary preference', async () => {
    render(<RSVPSection />);

    const veg = screen.getByLabelText(/^Vegetarian$/i);
    const nonVeg = screen.getByLabelText(/^Non-Vegetarian$/i);

    await userEvent.click(veg);
    expect(veg).toBeChecked();
    expect(nonVeg).not.toBeChecked();

    await userEvent.click(nonVeg);
    expect(nonVeg).toBeChecked();
    expect(veg).not.toBeChecked();
  });

  it('has default datetime values for travel', async () => {
    const { container } = render(<RSVPSection />);

    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));
    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    const datetimeInputs = container.querySelectorAll('input[type="datetime-local"]');
    expect(datetimeInputs[0]).toHaveValue('2026-07-05T18:00');
    expect(datetimeInputs[1]).toHaveValue('2026-07-09T10:00');
    expect(datetimeInputs[2]).toHaveValue('2026-07-18T12:00');
    expect(datetimeInputs[3]).toHaveValue('2026-07-20T10:00');
  });
});
