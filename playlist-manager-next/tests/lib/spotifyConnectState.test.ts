import { describe, it, expect, beforeEach } from 'vitest';
import { createConnectState, verifyConnectState } from '../../lib/spotifyConnectState';

describe('spotifyConnectState', () => {
  beforeEach(() => {
    process.env.AUTH0_SECRET = 'test-secret';
  });

  it('round-trips the user ID', () => {
    expect(verifyConnectState(createConnectState('user-1'))).toBe('user-1');
  });

  it('rejects an expired state', () => {
    const state = createConnectState('user-1', 0);
    expect(verifyConnectState(state, 11 * 60 * 1000)).toBeNull();
  });

  it('rejects a state with a tampered user ID', () => {
    const [, signature] = createConnectState('user-1').split('.');
    const forged = Buffer.from(JSON.stringify({ userId: 'user-2', expiresAt: Date.now() + 60_000 })).toString(
      'base64url'
    );
    expect(verifyConnectState(`${forged}.${signature}`)).toBeNull();
  });

  it('rejects a state signed with a different key', () => {
    const state = createConnectState('user-1');
    process.env.AUTH0_SECRET = 'other-secret';
    expect(verifyConnectState(state)).toBeNull();
  });

  it("rejects the web flow's plain state and missing state", () => {
    expect(verifyConnectState('some-random-state')).toBeNull();
    expect(verifyConnectState(null)).toBeNull();
  });
});
