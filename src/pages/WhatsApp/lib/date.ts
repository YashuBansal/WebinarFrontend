export function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

export function toDate(input: Date | string | number): Date {
  const d = input instanceof Date ? input : new Date(input);
  return isValidDate(d) ? d : new Date();
}

export function formatDate12(input: Date | string | number): string {
  const d = toDate(input);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime12(input?: Date | string | number | null): string {
  if (!input) return '';
  const d = toDate(input);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}/${month}/${year}, ${time}`;
}

export function formatTime12(input: Date | string | number): string {
  const d = toDate(input);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}


