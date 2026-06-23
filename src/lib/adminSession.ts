export const ADMIN_AUTH_COOKIE = 'ustaadpro_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'ustaadpro-admin-session-secret-change-me';

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );

  return base64UrlEncode(new Uint8Array(signature));
}

export async function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = await signPayload(issuedAt);

  return `${issuedAt}.${signature}`;
}

export async function isValidAdminSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split('.');
  if (!issuedAt || !signature) {
    return false;
  }

  const issuedAtTime = Number(issuedAt);
  if (!Number.isFinite(issuedAtTime)) {
    return false;
  }

  const ageSeconds = (Date.now() - issuedAtTime) / 1000;
  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  return signature === (await signPayload(issuedAt));
}
