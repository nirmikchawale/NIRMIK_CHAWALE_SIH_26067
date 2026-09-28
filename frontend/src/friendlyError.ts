/**
 * Plain-language error messages for the judge-facing UI.
 *
 * Raw fetch failures (status codes, HTML bodies, stack text) are logged to the
 * console for developers and never shown on screen.
 */

export class DataLoadError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "DataLoadError";
    this.status = status;
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * One-sentence explanation of why `what` could not be shown.
 * `what` is written for people, e.g. "the temperature field" or "INCOIS time-series data".
 */
export function friendlyLoadError(what: string, reason: unknown): string {
  if (reason !== undefined) console.warn(`[OceanTwin] Could not load ${what}:`, reason);
  if (isOffline()) return `Couldn't load ${what} because this device is offline. Reconnect and try again.`;
  const status = reason instanceof DataLoadError ? reason.status : null;
  if (status === 404) return `${capitalise(what)} isn't included in this deployment.`;
  if (status !== null && status >= 500) return `The data service had a problem loading ${what}. Try again in a moment.`;
  return `Couldn't load ${what}. Check your connection and try again.`;
}

/** Short label for the header when one or more optional sources are missing. */
export function offlineSourcesLabel(count: number): string {
  if (count <= 0) return "All sources loaded";
  return count === 1 ? "1 source offline" : `${count} sources offline`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
