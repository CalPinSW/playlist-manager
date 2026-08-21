// Covers the unauthenticated experience. There is no bespoke logged-out UI to
// assert on: middleware.ts redirects every unauthenticated request straight
// to /auth/login, which itself 307s on to the real Auth0-hosted login page
// (an external domain) before any of our own React ever renders. cy.request
// follows that redirect chain server-side without loading third-party UI
// into the browser, so this spec stays fast and has no external dependency
// on Auth0's login page being reachable/stable. No credentials required, so
// this spec always runs in CI. See logged-in.cy.js for the authenticated
// flows.

describe('logged out', () => {
  it('redirects the home page to Auth0 login', () => {
    cy.request({ url: '/', followRedirect: true }).then(res => {
      expect(res.redirects.join(' ')).to.include('/auth/login');
      expect(res.redirects.join(' ')).to.match(/auth0\.com\/authorize/);
    });
  });

  it('redirects a protected page straight to Auth0 login', () => {
    cy.request({ url: '/spotify', followRedirect: true }).then(res => {
      expect(res.redirects.join(' ')).to.match(/auth0\.com\/authorize/);
    });
  });

  it('does not redirect API routes through the Auth0 login page (they 401 instead)', () => {
    cy.request({ url: '/api/user', failOnStatusCode: false }).then(res => {
      expect(res.status).to.eq(401);
    });
  });
});
