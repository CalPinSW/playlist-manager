// Covers the authenticated experience via a real Auth0 hosted-login round
// trip. Requires CYPRESS_USER_EMAIL/CYPRESS_USER_PASSWORD for a real test
// account (Auth0 tenant + app DB) — set as GitHub Actions secrets. Every
// test skips itself (not fails) when those aren't configured, so this file
// is safe to run in CI before the secrets are added.
const EMAIL = Cypress.env('USER_EMAIL');
const PASSWORD = Cypress.env('USER_PASSWORD');

const login = () => {
  cy.get('input[name=email], input[name=username]').focus().clear().type(EMAIL);
  cy.get('input[name=password]').focus().clear().type(PASSWORD, { log: false });
  cy.get('button[type=submit][name=action]:visible, button[type=submit][name=submit]').click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/`);
};

describe('logged in', () => {
  beforeEach(function () {
    if (!EMAIL || !PASSWORD) {
      cy.log('Skipping — set CYPRESS_USER_EMAIL/CYPRESS_USER_PASSWORD to run authenticated e2e specs');
      this.skip();
    }
  });

  context('desktop', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('[data-testid=navbar-login-desktop]').click();
      login();
    });

    it('shows the profile menu instead of the login link', () => {
      cy.get('[data-testid=navbar-login-desktop]').should('not.exist');
      cy.get('[data-testid=navbar-picture-desktop]').should('be.visible');
    });

    it('reveals the Spotify nav link once authenticated', () => {
      cy.get('[data-testid=navbar]').contains('Spotify').should('be.visible');
    });

    it('shows the home page search sections', () => {
      cy.contains('Playlist Manager').should('be.visible');
      cy.contains('Search by Playlists').should('be.visible');
      cy.contains('Album Search').should('be.visible');
    });

    it('opens the profile menu with Spotify Settings and Log out links', () => {
      cy.get('[data-testid=navbar-picture-desktop]').click();
      cy.get('[data-testid=navbar-profile-desktop]')
        .should('be.visible')
        .and('have.attr', 'href', '/spotify-settings');
      cy.get('[data-testid=navbar-logout-desktop]').should('be.visible').and('have.attr', 'href', '/auth/logout');
    });

    it('navigates to Spotify settings from the profile menu', () => {
      cy.get('[data-testid=navbar-picture-desktop]').click();
      cy.get('[data-testid=navbar-profile-desktop]').click();
      cy.url().should('include', '/spotify-settings');
    });
  });

  context('mobile', () => {
    beforeEach(() => {
      cy.mobileViewport();
      cy.visit('/login');
      cy.get('[data-testid=navbar-toggle]').click();
      cy.get('[data-testid=navbar-login-desktop]').click();
      login();
    });

    it('reveals the Spotify nav link in the mobile menu once authenticated', () => {
      cy.get('[data-testid=navbar-toggle]').click();
      cy.get('[data-testid=navbar]').contains('Spotify').should('be.visible');
    });
  });
});
