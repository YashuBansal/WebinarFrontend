import { toDate } from './date';

type Input = Date | string | number | null | undefined;

function safeDate(input: Input): Date | null {
  if (input === null || input === undefined) return null;
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatProgramDate(input: Input): string {
  const d = safeDate(input);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatProgramTime(input: Input): string {
  const d = safeDate(input);
  if (!d) return '-';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${period}`;
}

export function formatProgramDateTime(input: Input): string {
  const d = safeDate(input);
  if (!d) return '-';
  return `${formatProgramDate(d)} ${formatProgramTime(d)}`;
}

