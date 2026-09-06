/**
 * NEPSOP custom Google Analytics 4 (GA4) event tracking.
 *
 * Loaded on every public page, right after the official Google tag
 * (gtag.js) snippet that lives in each page's <head>. This file only
 * records CUSTOM events on top of that tag. Standard page_view and the
 * GA4 "Enhanced Measurement" events (scroll, outbound click, site search,
 * video engagement, file download) are configured in the GA4 data-stream
 * settings, NOT in code — they must not be recreated here.
 *
 * No Google Tag Manager and no third-party analytics library is used:
 * events are pushed straight to window.dataLayer via the native gtag().
 *
 * PRIVACY: this file never reads or transmits form field values, names,
 * email addresses, phone numbers, addresses, or message content. Only
 * non-identifying context is sent (event names, CTA label/location and
 * the current page path).
 */
(function () {
  'use strict';

  // Pages without the Google tag (e.g. /admin/*) skip this file entirely.
  if (typeof window.gtag !== 'function') return;

  var pagePath = window.location.pathname;

  function track(eventName, params) {
    try {
      window.gtag('event', eventName, params);
    } catch (err) {
      // Analytics must never break the site.
    }
  }

  /** Best-effort description of where on the page the click happened. */
  function clickLocation(el) {
    var landmark = el.closest('.topbar, #header, #footer');
    if (landmark) {
      if (landmark.classList.contains('topbar')) return 'topbar';
      if (landmark.id === 'header') return 'header';
      if (landmark.id === 'footer') return 'footer';
    }
    var section = el.closest('section');
    if (section) {
      if (section.id) return section.id;
      var cls = typeof section.className === 'string' ? section.className : '';
      var m = cls.match(/[\\w-]*(hero|cta|contact)[\\w-]*/i);
      if (m) return m[0].slice(0, 40);
      return 'section';
    }
    return 'body';
  }

  /** CTA-like labels used by this site's primary conversion buttons. */
  var CTA_TEXT = /(^|\\s)(get started|start your sop|start your application|start your journey|start now|apply now|request a quote|talk to us|talk to our experts|contact us|send inquiry|book now|whatsapp us|discuss your (destination|study)|get your [a-z ']{0,40}sop( now)?|get a free consultation|free consultation|chat with us|join now|sign up|order now|back to homepage|explore sop services)/i;

  /** Buttons styled as CTAs across the site's page templates (matched by class). */
  var CTA_CLASS = /(btn-primary|btn-outline-secondary|btn-get-started|btn-contact-(primary|secondary)|btn-cta-(primary|secondary)|btn-hero-(primary|secondary)|btn-support-cta|btn-back-home|btn-view-services|cta-btn)/;

  function normalizeText(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  function shorten(text) {
    return text.length > 60 ? text.slice(0, 60) + '...' : text;
  }

  // One delegated listener for the whole page (works with any markup that
  // is added later, e.g. blog content loaded from the CMS).
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var control = target.closest('a, button');
    if (!control) return;

    var text = normalizeText(control);
    var isLink = control.tagName ? control.tagName.toLowerCase() === 'a' : false;
    var href = isLink ? (control.getAttribute('href') || '') : '';
    var location = clickLocation(control);

    // ---- Contact actions (one event per click, checked first) ----
    if (/^tel:/i.test(href)) {
      track('phone_click', { location: location, page_path: pagePath });
      return;
    }
    if (/^mailto:/i.test(href)) {
      track('email_click', { location: location, page_path: pagePath });
      return;
    }
    if (href.indexOf('wa.me/') !== -1) {
      track('whatsapp_click', { location: location, page_path: pagePath });
      return;
    }
    if (href.indexOf('instagram.com/') !== -1) {
      track('instagram_click', { location: location, page_path: pagePath });
      return;
    }
    if (href.indexOf('facebook.com/') !== -1) {
      // Outbound social click — covered by GA4 Enhanced Measurement.
      return;
    }

    // ---- CTA clicks ----
    // Skip form submit buttons: a lead is only recorded as generate_lead
    // once the form backend confirms success — never on the button click.
    if (control.closest('form')) return;

    var looksLikeCta =
      CTA_CLASS.test(typeof control.className === 'string' ? control.className : '') ||
      CTA_TEXT.test(text);
    if (!looksLikeCta || !text || text.length > 80) return;

    track('cta_click', {
      cta_name: shorten(text),
      cta_location: location,
      page_path: pagePath
    });
  }, false);

  /**
   * generate_lead — fired ONLY on confirmed success by the code that
   * actually submits a form (after validation AND a successful backend/API
   * response). It is never fired from a click handler.
   *
   * The public site's only form (#contactForm on contact.html) currently
   * has no working submit handler or backend, so nothing dispatches this
   * event today. When a real submission path is added, report the success
   * from its success branch with either:
   *
   *   window.nepsopGA.lead('contact_form');
   *
   * or:
   *
   *   document.dispatchEvent(new CustomEvent('nepsop:lead-success', {
   *     detail: { form_name: 'contact_form' }
   *   }));
   *
   * Only the form name is sent — never the submitted values.
   */
  window.nepsopGA = {
    lead: function (formName) {
      track('generate_lead', {
        form_name: formName || 'unknown_form',
        page_path: pagePath
      });
    }
  };
  document.addEventListener('nepsop:lead-success', function (e) {
    var name = (e && e.detail && e.detail.form_name) || 'unknown_form';
    track('generate_lead', { form_name: name, page_path: pagePath });
  });
})();
