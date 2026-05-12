import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RSVPSection from './RSVPSection';

// Mock two Supabase chains:
//   from('rsvps').insert([...]).select('edit_token').single()
//   from('site_config').select(...).maybeSingle()
const singleFn = vi.fn();
const selectFn = vi.fn(() => ({ single: singleFn }));
const insertFn = vi.fn(() => ({ select: selectFn }));

const configMaybeSingleFn = vi.fn();
const configSelectFn = vi.fn(() => ({ maybeSingle: configMaybeSingleFn }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'site_config') return { select: configSelectFn };
      return { insert: insertFn };
    },
  },
}));

vi.mock('gsap', () => ({
  default: {
    fromTo: vi.fn(),
    registerPlugin: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
    create: vi.fn(() => ({ kill: vi.fn() })),
  },
}));

vi.mock('@/components/ScrollReveal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RSVPSection', () => {
  beforeEach(() => {
    singleFn.mockReset();
    selectFn.mockClear();
    insertFn.mockClear();
    configMaybeSingleFn.mockReset();
    configSelectFn.mockClear();
    singleFn.mockResolvedValue({ data: { edit_token: 'test-token-1234' }, error: null });
    configMaybeSingleFn.mockResolvedValue({
      data: { rsvp_open: true, rsvp_closed_message: null },
      error: null,
    });
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

  it('email is optional — submits successfully without email', async () => {
    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(insertFn).toHaveBeenCalled();
    });

    const calls = insertFn.mock.calls as unknown as [Record<string, unknown>[]][];
    const payload = calls[0][0][0];
    expect(payload.email).toBeNull();
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

  it('submits successfully with valid data and shows edit link', async () => {
    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kerala reception/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(insertFn).toHaveBeenCalled();
      expect(screen.getByText(/Thank You!/i)).toBeInTheDocument();
      // Edit URL panel is shown
      expect(screen.getByText(/Need to make changes later/i)).toBeInTheDocument();
      const url = screen.getByDisplayValue(/\/rsvp\/edit\/test-token-1234$/i);
      expect(url).toBeInTheDocument();
    });

    const calls = insertFn.mock.calls as unknown as [Record<string, unknown>[]][];
    const payload = calls[0][0][0];
    expect(payload.full_name).toBe('Test User');
    expect(payload.phone).toBe('9999999999');
    expect(payload.dietary).toBe('veg');
    expect(payload.attending_kerala).toBe(true);
    expect(payload.attending_kolkata).toBe(false);
  });

  it('shows error banner when Supabase insert fails', async () => {
    singleFn.mockResolvedValue({ data: null, error: { message: 'Network error' } });

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

  it('hides arrival/departure until accommodation or pickup is requested', async () => {
    const { container } = render(<RSVPSection />);

    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));

    expect(container.querySelectorAll('input[type="datetime-local"]').length).toBe(0);
    expect(screen.queryByText(/Expected Arrival/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Yes, I need accommodation help/i));

    expect(screen.getByText(/Expected Arrival/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected Departure/i)).toBeInTheDocument();
    const datetimeInputs = container.querySelectorAll('input[type="datetime-local"]');
    expect(datetimeInputs.length).toBe(2);
    expect(datetimeInputs[0]).toHaveValue('');
    expect(datetimeInputs[1]).toHaveValue('');
  });

  it('blocks submit when accommodation is requested but travel dates are blank', async () => {
    render(<RSVPSection />);

    await userEvent.type(screen.getByPlaceholderText('Your full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('+91-XXXXXXXXXX'), '9999999999');
    await userEvent.click(screen.getByLabelText(/^Vegetarian$/i));
    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));
    await userEvent.click(screen.getByLabelText(/July 6 — Reception/i));
    await userEvent.click(screen.getByLabelText(/Yes, I need accommodation help/i));

    fireEvent.click(screen.getByRole('button', { name: /Submit RSVP/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter your expected arrival/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter your expected departure/i)).toBeInTheDocument();
    });
  });

  it('renders the closed card when site_config.rsvp_open is false', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        rsvp_open: false,
        rsvp_closed_message: 'We are no longer taking RSVPs for this event.',
      },
      error: null,
    });

    render(<RSVPSection />);

    await waitFor(() => {
      expect(screen.getByText(/Thank You for Your Interest/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/We are no longer taking RSVPs/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Your full name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit RSVP/i })).not.toBeInTheDocument();
  });

  it('"Use suggested" chip fills in the suggested arrival date', async () => {
    const { container } = render(<RSVPSection />);

    await userEvent.click(screen.getByLabelText(/Kolkata celebrations/i));
    await userEvent.click(screen.getByLabelText(/Yes, I need accommodation help/i));

    const chips = screen.getAllByText(/Use suggested:/i);
    expect(chips.length).toBeGreaterThanOrEqual(2);

    await userEvent.click(chips[0]);

    const datetimeInputs = container.querySelectorAll('input[type="datetime-local"]');
    expect(datetimeInputs[0]).toHaveValue('2026-07-05T18:00');
  });
});
