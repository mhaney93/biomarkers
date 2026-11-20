// Why a Google connect attempt failed. The routes redirect home with ?google=error&reason=<code>
// and the page shows only the fixed message for a known code, never text from the URL.
export const GOOGLE_ERRORS = {
  locked: "Unlock editing first",
  config: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set",
  denied: "Google sign-in was cancelled or refused",
  state: "Bad or expired state; try connecting again",
  "no-code": "Google sent no code",
  "no-refresh": "Google sent no refresh token; remove the app at myaccount.google.com/permissions and connect again",
  exchange: "Could not finish connecting to Google; try again",
} as const;

export type GoogleErrorCode = keyof typeof GOOGLE_ERRORS;

export function googleErrorMessage(reason: string | undefined) {
  return reason && Object.hasOwn(GOOGLE_ERRORS, reason) ? GOOGLE_ERRORS[reason as GoogleErrorCode] : "connection failed";
}
