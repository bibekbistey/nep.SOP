/**
 * Public Stats Loader
 * Fetches site_stats from Supabase and updates the homepage hero trust grid.
 * Falls back to static values if the request fails.
 */
(function () {
  'use strict';

  const FALLBACK = {
    years_experience: 6,
    sops_delivered: 20000,
    assignments_delivered: 1000,
  };

  /**
   * Format a number for display (e.g., 20000 → "20K+").
   */
  function formatStatValue(key, value) {
    switch (key) {
      case 'years_experience':
        return value + '+ Years';
      case 'sops_delivered':
        if (value >= 1000) return Math.round(value / 1000) + 'K+';
        return value + '+';
      case 'assignments_delivered':
        if (value >= 1000) return Math.round(value / 1000) + 'K+';
        return value + '+';
      default:
        return String(value);
    }
  }

  /**
   * Update the DOM with stat values.
   */
  function updateStatsDisplay(stats) {
    const mapping = {
      years_experience: '[data-stat="years_experience"]',
      sops_delivered: '[data-stat="sops_delivered"]',
      assignments_delivered: '[data-stat="assignments_delivered"]',
    };

    Object.entries(mapping).forEach(([key, selector]) => {
      const el = document.querySelector(selector);
      if (el && stats[key] !== undefined) {
        el.textContent = formatStatValue(key, stats[key]);
      }
    });
  }

  /**
   * Initialize stats loading on page load.
   */
  async function init() {
    if (!window.NEPSOP_SUPABASE) {
      console.warn('[NEPSOP] Supabase client not available, using fallback stats');
      updateStatsDisplay(FALLBACK);
      return;
    }

    try {
      const { data, error } = await window.NEPSOP_SUPABASE
        .from('site_stats')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        updateStatsDisplay({
          years_experience: data.years_experience,
          sops_delivered: data.sops_delivered,
          assignments_delivered: data.assignments_delivered,
        });
      } else {
        updateStatsDisplay(FALLBACK);
      }
    } catch (err) {
      console.error('[NEPSOP] Failed to load stats from Supabase:', err);
      updateStatsDisplay(FALLBACK);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
