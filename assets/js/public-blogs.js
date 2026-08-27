/**
 * Public Blogs Module
 * Handles fetching and displaying published blog posts on public pages.
 */
(function () {
  'use strict';

  const NEPSOP_PUBLIC = (window.NEPSOP_PUBLIC = window.NEPSOP_PUBLIC || {});

  /**
   * Format a date string for display.
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Escape HTML to prevent XSS.
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Load published blogs into a list container.
   */
  async function loadBlogList(containerId, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
      const { data, error } = await window.NEPSOP_SUPABASE
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-journal-text" style="font-size: 48px; color: #ccc;"></i>
            <p class="mt-3" style="color: #666;">${escapeHtml(emptyMessage || 'No blog posts found.')}</p>
          </div>
        `;
        return;
      }

      container.innerHTML = data
        .map(
          (blog) => `
        <div class="col-lg-4 col-md-6" data-aos="fade-up">
          <article class="blog-card">
            ${
              blog.featured_image
                ? `<div class="blog-card-img">
                <img src="${escapeHtml(blog.featured_image)}" alt="${escapeHtml(blog.title)}" loading="lazy">
              </div>`
                : ''
            }
            <div class="blog-card-body">
              <span class="blog-card-date">
                <i class="bi bi-calendar3"></i> ${formatDate(blog.published_at)}
              </span>
              <h3 class="blog-card-title">
                <a href="blog.html?id=${encodeURIComponent(blog.id)}&slug=${encodeURIComponent(blog.slug || '')}">${escapeHtml(blog.title)}</a>
              </h3>
              <p class="blog-card-excerpt">${escapeHtml(blog.excerpt)}</p>
              <div class="blog-card-meta">
                ${blog.author ? `<span class="blog-card-author"><i class="bi bi-person"></i> ${escapeHtml(blog.author)}</span>` : ''}
                <a href="blog.html?id=${encodeURIComponent(blog.id)}&slug=${encodeURIComponent(blog.slug || '')}" class="blog-card-link">
                  Read More <i class="bi bi-arrow-right"></i>
                </a>
              </div>
            </div>
          </article>
        </div>
      `
        )
        .join('');

      // Refresh AOS so dynamically inserted cards get their animations
      if (typeof AOS !== 'undefined') {
        AOS.refresh();
      }
    } catch (err) {
      console.error('[NEPSOP] Failed to load blogs:', err);
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-exclamation-triangle" style="font-size: 48px; color: #dc3545;"></i>
          <p class="mt-3" style="color: #666;">Unable to load blog posts. Please try again later.</p>
        </div>
      `;
    }
  }

  /**
   * Load a single blog post for the detail page.
   */
  async function loadBlogDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const slug = params.get('slug');

    if (!id && !slug) {
      showNotFound();
      return;
    }

    const container = document.getElementById('blog-content');
    const metaContainer = document.getElementById('blog-meta');

    if (!container) return;

    try {
      let query = window.NEPSOP_SUPABASE
        .from('blogs')
        .select('*');

      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', slug);
      }

      const { data, error } = await query
        .eq('status', 'published')
        .single();

      if (error || !data) {
        showNotFound();
        return;
      }

      // Update page title and meta tags
      document.title = data.title + ' | nep.SOP Blog';

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', data.excerpt || data.title);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', data.title);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', data.excerpt || data.title);

      if (data.featured_image) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', data.featured_image);
      }

      // Render content
      if (metaContainer) {
        metaContainer.innerHTML = `
          <div class="blog-detail-meta">
            ${data.author ? `<span class="blog-detail-author"><i class="bi bi-person"></i> ${escapeHtml(data.author)}</span>` : ''}
            <span class="blog-detail-date"><i class="bi bi-calendar3"></i> ${formatDate(data.published_at)}</span>
          </div>
        `;
      }

      let imageHtml = '';
      if (data.featured_image) {
        imageHtml = `<img src="${escapeHtml(data.featured_image)}" alt="${escapeHtml(data.title)}" class="blog-detail-featured-img">`;
      }

      container.innerHTML = `
        <h1 class="blog-detail-title">${escapeHtml(data.title)}</h1>
        ${metaContainer ? metaContainer.outerHTML : ''}
        ${imageHtml}
        <div class="blog-detail-content">
          ${data.content || '<p>No content available.</p>'}
        </div>
        <div class="blog-detail-back mt-5">
          <a href="blogs.html" class="blog-back-link">
            <i class="bi bi-arrow-left"></i> Back to All Blogs
          </a>
        </div>
      `;
    } catch (err) {
      console.error('[NEPSOP] Failed to load blog detail:', err);
      showNotFound();
    }
  }

  function showNotFound() {
    document.title = 'Blog Not Found | nep.SOP';
    const container = document.getElementById('blog-content');
    if (container) {
      container.innerHTML = `
        <div class="blog-not-found">
          <i class="bi bi-journal-x" style="font-size: 64px; color: #ccc;"></i>
          <h2>Blog Post Not Found</h2>
          <p>The blog post you're looking for doesn't exist or has been removed.</p>
          <a href="blogs.html" class="btn-get-started" style="display:inline-block; margin-top:20px; border-radius:50px; padding:12px 32px; background:var(--color-primary); color:#fff; text-decoration:none;">
            <i class="bi bi-arrow-left"></i> Back to Blogs
          </a>
        </div>
      `;
    }
  }

  NEPSOP_PUBLIC.blogs = {
    loadBlogList,
    loadBlogDetail,
    formatDate,
  };
})();
