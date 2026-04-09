export function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function getTodayDateInputValue(): string {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

export function toDateInputValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}
