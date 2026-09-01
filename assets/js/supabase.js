/**
 * Supabase Client Module
 * Initializes and exports a single Supabase client instance.
 */
(function () {
  'use strict';

  const cfg = window.NEPSOP_CONFIG || {};

  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
    console.error('[NEPSOP] Missing Supabase configuration. Check assets/js/config.js');
  }

  const client = window.supabase.createClient(
    cfg.SUPABASE_URL || '',
    cfg.SUPABASE_PUBLISHABLE_KEY || ''
  );

  // Admin modules reference NEPSOP.supabase
  const NEPSOP = (window.NEPSOP = window.NEPSOP || {});
  NEPSOP.supabase = client;

  // Public modules reference window.NEPSOP_SUPABASE (backward compat)
  window.NEPSOP_SUPABASE = client;
})();
