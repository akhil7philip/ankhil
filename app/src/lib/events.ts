export type IconType = 'reception' | 'mehendi' | 'haldi' | 'sangeet' | 'wedding' | 'kerala';

export interface EventItem {
  id: string;
  date: string;
  name: string;
  time: string;
  dressCode?: string;
  notes?: string;
  venue?: string;
  mapUrl?: string;
  city: 'kolkata' | 'kerala';
  iconType: IconType;
  start: string;
  end: string;
}

export const kolkataEventsBase: EventItem[] = [
  {
    id: 'mehendi',
    date: 'July 6',
    name: 'Mehendi',
    time: '3:00 PM onwards',
    dressCode: 'Shades of green',
    notes:
      "An evening as henna is applied to the bride's hands and feet. Family and close friends are welcome to get henna applied themselves.",
    city: 'kolkata',
    iconType: 'mehendi',
    start: '2026-07-06T15:00:00+05:30',
    end: '2026-07-06T22:00:00+05:30',
  },
  {
    id: 'haldi',
    date: 'July 7',
    name: 'Haldi',
    time: '10:00 AM – 1:00 PM',
    dressCode: 'Shades of yellow',
    notes:
      'A playful turmeric ceremony where family and friends apply a paste of turmeric, sandalwood, and rose water on the bride and groom — said to bless the couple and leave them glowing.',
    city: 'kolkata',
    iconType: 'haldi',
    start: '2026-07-07T10:00:00+05:30',
    end: '2026-07-07T13:00:00+05:30',
  },
  {
    id: 'sangeet',
    date: 'July 7',
    name: 'Musical Night',
    time: '7:00 PM onwards',
    dressCode: 'Shades of gold and silver',
    notes: 'An evening of music and dance, with family and friends.',
    city: 'kolkata',
    iconType: 'sangeet',
    start: '2026-07-07T19:00:00+05:30',
    end: '2026-07-07T23:00:00+05:30',
  },
  {
    id: 'varmala',
    date: 'July 8',
    name: 'Varmala & Reception',
    time: '6:00 PM onwards',
    dressCode: 'Indian or Western Formals',
    notes:
      'The couple exchange floral garlands (varmala), followed by a reception with extended family and friends before the wedding ceremony later that night.',
    city: 'kolkata',
    iconType: 'reception',
    start: '2026-07-08T18:00:00+05:30',
    end: '2026-07-08T22:00:00+05:30',
  },
  {
    id: 'pheras',
    date: 'July 8',
    name: 'Wedding Ceremony & Pheras',
    time: '10:30 PM – 12:30 AM (July 9)',
    dressCode: 'Indian or Western Formals',
    notes:
      'The sacred Hindu rites — including the Pheras (seven circles around a holy fire) — that mark Ankita and Akhil as married. The ceremony runs about 2 hours; seating is provided.',
    city: 'kolkata',
    iconType: 'wedding',
    start: '2026-07-08T22:30:00+05:30',
    end: '2026-07-09T00:30:00+05:30',
  },
];

export const keralaEventsBase: EventItem[] = [
  {
    id: 'kerala',
    date: 'July 25',
    name: 'Pala Reception',
    time: '6:00 PM onwards',
    dressCode: 'Indian or Western Formals',
    notes:
      'A wedding reception with the couple, both families, friends and hometown community.',
    city: 'kerala',
    iconType: 'kerala',
    start: '2026-07-25T18:00:00+05:30',
    end: '2026-07-25T22:00:00+05:30',
  },
];

export const ALL_KOLKATA_EVENT_IDS = kolkataEventsBase.map((e) => e.id);

export function getVisibleEvents(
  events: EventItem[],
  hiddenEvents: string[]
): EventItem[] {
  const hidden = new Set(hiddenEvents);
  return events.filter((e) => !hidden.has(e.id));
}

export function getKolkataDateRange(hiddenEvents: string[] = []): string {
  const visible = getVisibleEvents(kolkataEventsBase, hiddenEvents);
  const days = visible
    .map((e) => new Date(e.start).getDate())
    .sort((a, b) => a - b);
  const first = days[0];
  const last = days[days.length - 1];
  return first === last
    ? `July ${first}, 2026`
    : `July ${first} – ${last}, 2026`;
}

export function getKolkataCountdownDate(hiddenEvents: string[] = []): Date {
  const visible = getVisibleEvents(kolkataEventsBase, hiddenEvents);
  const earliest = visible.reduce((min, e) =>
    new Date(e.start) < new Date(min.start) ? e : min
  );
  const d = new Date(earliest.start);
  return new Date(
    Date.UTC(2026, 6, d.getDate(), 0, 0, 0)
  );
}

export function getKolkataEventsEnd(hiddenEvents: string[] = []): Date {
  const visible = getVisibleEvents(kolkataEventsBase, hiddenEvents);
  const latest = visible.reduce((max, e) =>
    new Date(e.end) > new Date(max.end) ? e : max
  );
  return new Date(latest.end);
}
