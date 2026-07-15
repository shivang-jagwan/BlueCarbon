const DEVICE_ID_KEY = 'carbonrush_device_id';

export function getClientDeviceInfo(): { device: string; browser: string } {
  const ua = navigator.userAgent;

  let device = 'Unknown';
  if (/Windows/i.test(ua)) device = 'Windows';
  else if (/Mac OS/i.test(ua)) device = 'Mac OS';
  else if (/Linux/i.test(ua)) device = 'Linux';
  else if (/Android/i.test(ua)) device = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  return { device, browser };
}

export function getStoredDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function rateLimitClient(
  action: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: maxAttempts, resetAt: 0 };
  }

  const key = `rl_${action}`;
  const now = Date.now();
  const raw = localStorage.getItem(key);

  let attempts: number;
  let windowStart: number;

  if (raw) {
    const parsed = JSON.parse(raw) as { attempts: number; windowStart: number };
    if (now - parsed.windowStart > windowMs) {
      attempts = 0;
      windowStart = now;
    } else {
      attempts = parsed.attempts;
      windowStart = parsed.windowStart;
    }
  } else {
    attempts = 0;
    windowStart = now;
  }

  attempts += 1;
  localStorage.setItem(key, JSON.stringify({ attempts, windowStart }));

  const remaining = Math.max(0, maxAttempts - attempts);
  const resetAt = windowStart + windowMs;

  return { allowed: attempts <= maxAttempts, remaining, resetAt };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, '')
    .trim();
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}
