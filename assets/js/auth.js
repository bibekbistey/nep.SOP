/**
 * Admin Authentication Module
 * Handles Supabase Auth: login, logout, session checks, and route protection.
 */
(function () {
  'use strict';

  const NEPSOP = (window.NEPSOP = window.NEPSOP || {});

  /**
   * Get the current Supabase session.
   */
  async function getSession() {
    const { data, error } = await NEPSOP.supabase.auth.getSession();
    if (error) {
      console.error('[NEPSOP Auth] getSession error:', error);
      return null;
    }
    return data.session;
  }

  /**
   * Get the current authenticated user.
   */
  async function getUser() {
    const { data, error } = await NEPSOP.supabase.auth.getUser();
    if (error) {
      console.error('[NEPSOP Auth] getUser error:', error);
      return null;
    }
    return data.user;
  }

  /**
   * Sign in with email and password.
   */
  async function login(email, password) {
    const { data, error } = await NEPSOP.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign out the current user.
   */
  async function logout() {
    const { error } = await NEPSOP.supabase.auth.signOut();
    if (error) {
      console.error('[NEPSOP Auth] logout error:', error);
    }
    window.location.href = '/admin/login.html';
  }

  /**
   * Check if the user is the designated admin.
   * Uses the configured admin email as a frontend guard.
   * The primary security is enforced by Supabase RLS.
   */
  async function isAdmin() {
    const user = await getUser();
    if (!user) return false;

    const adminEmails = getAdminEmails();
    if (adminEmails.length && adminEmails.includes((user.email || '').toLowerCase())) return true;

    // If no admin email is configured, allow any authenticated user (RLS is the real guard)
    if (!adminEmails.length) return true;

    return false;
  }

  function getAdminEmails() {
    const config = window.NEPSOP_CONFIG || {};
    const configuredEmails = config.ADMIN_EMAILS || config.ADMIN_EMAIL || '';
    return configuredEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Require authentication — redirect to login if not authenticated.
   * Call this at the top of every admin page.
   */
  async function requireAuth() {
    const session = await getSession();
    if (!session) {
      window.location.href = '/admin/login.html';
      return null;
    }

    // Also verify admin email if configured
    const adminEmails = getAdminEmails();
    if (adminEmails.length && !adminEmails.includes((session.user.email || '').toLowerCase())) {
      // Not the admin — sign out and redirect
      await NEPSOP.supabase.auth.signOut();
      window.location.href = '/admin/login.html';
      return null;
    }

    return session;
  }

  /**
   * Redirect away if already authenticated (for login page).
   */
  async function redirectIfAuthenticated() {
    const session = await getSession();
    if (session) {
      window.location.href = '/admin/index.html';
      return true;
    }
    return false;
  }

  // Expose public API
  NEPSOP.auth = {
    getSession,
    getUser,
    login,
    logout,
    isAdmin,
    requireAuth,
    redirectIfAuthenticated,
  };
})();
