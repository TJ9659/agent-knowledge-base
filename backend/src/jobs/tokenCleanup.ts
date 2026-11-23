import { authService } from '../services/authService.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function runCleanup() {
  try {
    const count = await authService.cleanupExpiredTokens();
    if (count > 0) console.log(`Removed ${count} expired refresh tokens`);
  } catch (err) {
    console.error('Refresh token cleanup failed', err);
  }
}

// runs once on boot, then every hour
export function startTokenCleanup() {
  void runCleanup();
  const timer = setInterval(() => void runCleanup(), CLEANUP_INTERVAL_MS);
  // dont keep the process alive just for this timer
  timer.unref();
  return timer;
}
