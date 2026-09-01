/**
 * Admin Stats Module
 * Handles loading and updating site statistics from Supabase.
 */
(function () {
  'use strict';

  const NEPSOP = (window.NEPSOP = window.NEPSOP || {});

  /**
   * Fetch the current site_stats row from Supabase.
   */
  async function getStats() {
    const { data, error } = await NEPSOP.supabase
      .from('site_stats')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('[NEPSOP Stats] Fetch error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Update the site_stats row.
   */
  async function updateStats(id, stats) {
    const { data, error } = await NEPSOP.supabase
      .from('site_stats')
      .update({
        years_experience: Number(stats.years_experience) || 0,
        sops_delivered: Number(stats.sops_delivered) || 0,
        assignments_delivered: Number(stats.assignments_delivered) || 0,
        customers: Number(stats.customers) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[NEPSOP Stats] Update error:', error);
      throw error;
    }
    return data;
  }

  NEPSOP.stats = {
    getStats,
    updateStats,
  };
})();
