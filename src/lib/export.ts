/**
 * Client-side export helpers: CSV (tables) and ICS (calendar events).
 * Kept on the client so any already-loaded view can be exported without extra
 * server round-trips.
 */

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote when the value contains separators, quotes, or newlines.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize an array of row objects to a CSV string (header from first row). */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return lines.join('\r\n');
}

/** Trigger a browser download of a text/blob payload. */
export function downloadBlob(filename: string, content: string | Blob, mime = 'text/plain'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Utility: parse a Date to the ICS UTC datetime format `YYYYMMDDTHHMMSSZ`. */
function icsDateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Strip CR/LF/tabs from a single-line ICS field value. */
function icsEscape(text: string): string {
  return text.replace(/[\r\n\t]+/g, ' ').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export interface IcsEventInput {
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  start: Date;
  end: Date;
}

/** Build an Outlook/Google/iCal-friendly single-event `.ics` payload. */
export function buildICS(event: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LinkPilot//Interview//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${icsDateTime(new Date())}`,
    `DTSTART:${icsDateTime(event.start)}`,
    `DTEND:${icsDateTime(event.end)}`,
    `SUMMARY:${icsEscape(event.summary)}`,
  ];
  if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
  // 30-minute advance alarm, mirrored on the device.
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.join('\r\n');
}