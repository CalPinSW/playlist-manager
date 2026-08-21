import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jose before importing the module under test.
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn()
}));

import { verifyBearerToken, extractBearerToken } from '../../lib/auth0-bearer';
import { jwtVerify } from 'jose';

const mockJwtVerify = vi.mocked(jwtVerify);

describe('extractBearerToken', () => {
  it('extracts token from valid Bearer header', () => {
    expect(extractBearerToken('Bearer my-token-123')).toBe('my-token-123');
  });

  it('returns null for null header', () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it('returns null for non-Bearer Authorization header', () => {
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractBearerToken('')).toBeNull();
  });
});

describe('verifyBearerToken', () => {
  // A JWS (not JWE) shaped token: 3 dot-separated parts, header base64url-decodes
  // to `{"alg":"RS256"}` (no `enc` field), so it clears both the opaque-token
  // guard (must start with "eyJ") and the JWE-detection check, reaching the
  // jwtVerify() call the tests below actually exercise (jose is mocked).
  const JWS_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'example.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://api.example.com';
  });

  it('rejects an opaque (non-JWT) token before ever calling jwtVerify', async () => {
    await expect(verifyBearerToken('opaque-token-no-dots')).rejects.toThrow('opaque');
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it('returns sub when token is valid', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'auth0|user-123' } } as never);

    const result = await verifyBearerToken(JWS_TOKEN);

    expect(result).toEqual({ sub: 'auth0|user-123' });
    expect(mockJwtVerify).toHaveBeenCalledWith(
      JWS_TOKEN,
      'mock-jwks',
      expect.objectContaining({
        issuer: 'https://example.auth0.com/',
        audience: 'https://api.example.com'
      })
    );
  });

  it('throws when token is invalid', async () => {
    mockJwtVerify.mockRejectedValue(new Error('JWTExpired'));

    await expect(verifyBearerToken(JWS_TOKEN)).rejects.toThrow('JWTExpired');
  });

  it('throws when sub claim is missing', async () => {
    mockJwtVerify.mockResolvedValue({ payload: {} } as never);

    await expect(verifyBearerToken(JWS_TOKEN)).rejects.toThrow('missing sub claim');
  });
});
