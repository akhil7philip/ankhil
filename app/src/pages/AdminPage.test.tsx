import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminPage from './AdminPage';

const maybeSingleFn = vi.fn();
const configSelectFn = vi.fn(() => ({ maybeSingle: maybeSingleFn }));
const configUpdateFn = vi.fn(() => ({
  eq: vi.fn(() => ({
    select: vi.fn(() => ({ maybeSingle: maybeSingleFn })),
  })),
}));
const rsvpsSelectFn = vi.fn(() => ({
  order: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));
const deleteFn = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'site_config') {
        return {
          select: configSelectFn,
          update: configUpdateFn,
        };
      }
      return {
        select: rsvpsSelectFn,
        delete: deleteFn,
      };
    },
  },
}));

const baseConfig = {
  rsvp_open: true,
  rsvp_closed_message: null,
  kolkata_venue: 'New Town, Kolkata',
  kolkata_map_url: '',
  kolkata_railway_stations: ['Sealdah Railway Station'],
  kerala_venue: 'Pala, Kerala',
  kerala_map_url: '',
  kerala_railway_stations: ['Kottayam Railway Station'],
  kerala_non_veg: false,
  faq_visible: true,
  gallery_visible: true,
  hidden_events: ['mehendi'],
  updated_at: '2026-01-01T00:00:00Z',
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => 'true'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('import', { meta: { env: { VITE_ADMIN_PASSWORD: 'testpass' } } });

    maybeSingleFn.mockReset();
    configSelectFn.mockClear();
    configUpdateFn.mockClear();
    rsvpsSelectFn.mockClear();
    deleteFn.mockClear();

    maybeSingleFn.mockResolvedValue({ data: baseConfig, error: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders event visibility card with correct checkboxes', async () => {
    render(<AdminPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Site Settings/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Site Settings/i }));

    await waitFor(() => {
      expect(screen.getByText('Event Visibility')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Mehendi')).toBeInTheDocument();
    expect(screen.getByLabelText('Haldi')).toBeInTheDocument();
    expect(screen.getByLabelText('Musical Night')).toBeInTheDocument();
    expect(screen.getByLabelText('Varmala & Reception')).toBeInTheDocument();
    expect(screen.getByLabelText('Wedding Ceremony & Pheras')).toBeInTheDocument();
  });

  it('mehendi starts unchecked when hidden by default', async () => {
    render(<AdminPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Site Settings/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Site Settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Mehendi')).toBeInTheDocument();
    });

    const mehendiCheckbox = screen.getByLabelText('Mehendi') as HTMLInputElement;
    expect(mehendiCheckbox.checked).toBe(false);
  });

  it('toggling an event and saving updates hidden_events', async () => {
    render(<AdminPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Site Settings/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Site Settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Mehendi')).toBeInTheDocument();
    });

    // Check mehendi (make it visible)
    await userEvent.click(screen.getByLabelText('Mehendi'));

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /Save visibility/i }));

    await waitFor(() => {
      expect(configUpdateFn).toHaveBeenCalled();
    });

    const updateCall = (configUpdateFn.mock.calls as unknown[][])[0][0] as Record<string, unknown>;
    expect(updateCall.hidden_events).toEqual([]);
  });

  it('prevents hiding all events and shows validation error', async () => {
    render(<AdminPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Site Settings/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Site Settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Haldi')).toBeInTheDocument();
    });

    // Uncheck all remaining visible events
    await userEvent.click(screen.getByLabelText('Haldi'));
    await userEvent.click(screen.getByLabelText('Musical Night'));
    await userEvent.click(screen.getByLabelText('Varmala & Reception'));
    await userEvent.click(screen.getByLabelText('Wedding Ceremony & Pheras'));

    fireEvent.click(screen.getByRole('button', { name: /Save visibility/i }));

    await waitFor(() => {
      expect(screen.getByText(/At least one Kolkata event must remain visible/i)).toBeInTheDocument();
    });

    expect(configUpdateFn).not.toHaveBeenCalled();
  });
});
