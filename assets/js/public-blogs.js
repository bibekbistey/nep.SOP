/**
 * Public Blogs Module
 * Handles fetching and displaying published blog posts on public pages.
 */
(function () {
  'use strict';

  const NEPSOP_PUBLIC = (window.NEPSOP_PUBLIC = window.NEPSOP_PUBLIC || {});

  const blogState = {
    blogs: [],
    currentCategory: 'all',
    searchTerm: '',
    page: 1,
    perPage: 6,
  };

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function stripHtml(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  function truncateText(text, length) {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length <= length ? clean : clean.slice(0, length).trim() + '...';
  }

  function estimateReadingTime(blog) {
    const text = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''}`;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(2, Math.ceil(words / 180));
    return `${minutes} min read`;
  }

  function getBlogCategory(blog) {
    const text = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''}`.toLowerCase();

    if (/statement of purpose|sop writing|personal statement|sop/.test(text)) return 'SOP Writing';
    if (/study abroad|university|admission|application|international student|study/.test(text)) return 'Study Abroad';
    if (/visa|immigration|migration/.test(text)) return 'Visa Guide';
    if (/australia|canada|usa|uk|germany|malta|dependent|destination/.test(text)) return 'Destinations';
    return 'Tips & Guides';
  }

  function detectCategory(blog) {
    const haystack = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''}`.toLowerCase();

    if (/statement of purpose|sop writing|personal statement|sop/.test(haystack)) return 'SOP Writing';
    if (/study abroad|university|admission|application|international student|study/.test(haystack)) return 'Study Abroad';
    if (/visa|immigration|migration/.test(haystack)) return 'Visa Guide';
    if (/australia|canada|usa|uk|germany|malta|dependent|destination/.test(haystack)) return 'Destinations';
    return 'Tips & Guides';
  }

  function matchesSearch(blog, value) {
    if (!value) return true;
    const query = value.toLowerCase();
    const haystack = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''} ${blog.author || ''}`.toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function getFilteredBlogs() {
    return blogState.blogs.filter((blog) => {
      const categoryMatch = blogState.currentCategory === 'all' || detectCategory(blog) === blogState.currentCategory;
      const searchMatch = matchesSearch(blog, blogState.searchTerm);
      return categoryMatch && searchMatch;
    });
  }

  function buildPagination(totalPages) {
    const container = document.getElementById('blogPagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = [];
    const currentPage = blogState.page;

    pages.push({ type: 'prev', page: Math.max(1, currentPage - 1), disabled: currentPage === 1, label: '<i class="bi bi-chevron-left"></i> Previous' });

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push({ type: 'page', page, active: page === currentPage, label: String(page) });
    }

    if (endPage < totalPages) {
      pages.push({ type: 'ellipsis', label: '…' });
      pages.push({ type: 'page', page: totalPages, active: totalPages === currentPage, label: String(totalPages) });
    }

    if (startPage > 1) {
      pages.unshift({ type: 'page', page: 1, active: 1 === currentPage, label: '1' });
      pages.splice(1, 0, { type: 'ellipsis', label: '…' });
    }

    pages.push({ type: 'next', page: Math.min(totalPages, currentPage + 1), disabled: currentPage === totalPages, label: 'Next <i class="bi bi-chevron-right"></i>' });

    const html = pages.map((item) => {
      if (item.type === 'ellipsis') {
        return '<button class="blog-page-btn ellipsis" type="button" disabled aria-hidden="true">…</button>';
      }

      const isNav = item.type === 'prev' || item.type === 'next';
      const isDisabled = isNav && item.disabled;
      const className = item.type === 'page'
        ? `blog-page-btn ${item.active ? 'active' : ''}`
        : 'blog-page-btn';

      return `<button type="button" class="${className}" data-page="${item.page}" ${isDisabled ? 'disabled' : ''}>${item.label}</button>`;
    }).join('');

    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const newPage = Number(button.getAttribute('data-page'));
        if (!newPage) return;
        blogState.page = newPage;
        renderBlogList();
        document.getElementById('blogList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderBlogList() {
    const container = document.getElementById('blogList');
    const pagination = document.getElementById('blogPagination');
    if (!container) return;

    const filteredBlogs = getFilteredBlogs();
    const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / blogState.perPage));
    if (blogState.page > totalPages) blogState.page = totalPages;

    if (!filteredBlogs.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="blog-empty">
            <i class="bi bi-journal-x"></i>
            <h3>No articles found</h3>
            <p>Try another search term or browse all posts to find more helpful SOP writing and study-abroad insights.</p>
            <button class="admin-btn admin-btn-primary" type="button" id="clearFiltersBtn" style="padding:10px 18px; border-radius: 12px; font-weight: 600;">View All Posts</button>
          </div>
        </div>
      `;
      if (pagination) pagination.innerHTML = '';

      const clear = document.getElementById('clearFiltersBtn');
      if (clear) {
        clear.addEventListener('click', () => {
          blogState.currentCategory = 'all';
          blogState.searchTerm = '';
          blogState.page = 1;
          const searchInput = document.getElementById('blogSearch');
          if (searchInput) searchInput.value = '';
          const filterButtons = document.querySelectorAll('.blog-filter-btn');
          filterButtons.forEach((button) => button.classList.toggle('active', button.dataset.category === 'all'));
          renderBlogList();
        });
      }
      return;
    }

    const startIndex = (blogState.page - 1) * blogState.perPage;
    const visibleBlogs = filteredBlogs.slice(startIndex, startIndex + blogState.perPage);

    container.innerHTML = visibleBlogs.map((blog) => {
      const category = detectCategory(blog);
      const image = blog.featured_image
        ? `<img src="${escapeHtml(blog.featured_image)}" alt="${escapeHtml(blog.title)}" loading="lazy">`
        : `<div class="blog-card-image-placeholder"><i class="bi bi-journal-text"></i></div>`;
      const excerpt = truncateText(stripHtml(blog.excerpt || blog.content || ''), 150) || 'Explore practical advice and actionable insights for your academic journey.';
      const author = blog.author ? `<span class="blog-card-author"><i class="bi bi-person"></i> ${escapeHtml(blog.author)}</span>` : '';
      const blogUrl = `blog.html?id=${encodeURIComponent(blog.id)}&slug=${encodeURIComponent(blog.slug || '')}`;

      return `
        <div class="col-lg-4 col-md-6" data-aos="fade-up">
          <article class="blog-card">
            <div class="blog-card-image">
              ${image}
            </div>
            <div class="blog-card-body">
              <div class="blog-card-meta-row">
                <span class="blog-card-tag">${escapeHtml(category)}</span>
                <span class="blog-card-date"><i class="bi bi-calendar3"></i> ${formatDate(blog.published_at || blog.created_at)}</span>
              </div>

              <h3 class="blog-card-title">
                <a href="${blogUrl}">${escapeHtml(blog.title)}</a>
              </h3>

              <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>

              <div class="blog-card-footer">
                <div class="blog-card-author">${author || `<span class="blog-card-author"><i class="bi bi-clock"></i> ${estimateReadingTime(blog)}</span>`}</div>
                <a href="${blogUrl}" class="blog-card-link">Read More <i class="bi bi-arrow-right"></i></a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join('');

    buildPagination(totalPages);

    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  function handleFilterButtonClick(button) {
    const category = button.getAttribute('data-category');
    if (!category) return;

    blogState.currentCategory = category;
    blogState.page = 1;

    document.querySelectorAll('.blog-filter-btn').forEach((item) => {
      item.classList.toggle('active', item.getAttribute('data-category') === category);
    });

    renderBlogList();
  }

  function bindFilters() {
    document.querySelectorAll('.blog-filter-btn').forEach((button) => {
      button.addEventListener('click', () => handleFilterButtonClick(button));
    });

    const searchInput = document.getElementById('blogSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        blogState.searchTerm = event.target.value.trim();
        blogState.page = 1;
        renderBlogList();
      });
    }
  }

  async function loadBlogList(containerId, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="col-12"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"><span class="visually-hidden">Loading...</span></div></div></div>';

    try {
      const { data, error } = await window.NEPSOP_SUPABASE
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      blogState.blogs = data || [];

      if (!blogState.blogs.length) {
        container.innerHTML = `
          <div class="col-12">
            <div class="blog-empty">
              <i class="bi bi-journal-text"></i>
              <h3>No articles yet</h3>
              <p>${escapeHtml(emptyMessage || 'No blog posts published yet. Check back soon!')}</p>
            </div>
          </div>
        `;
        const pagination = document.getElementById('blogPagination');
        if (pagination) pagination.innerHTML = '';
        return;
      }

      bindFilters();
      renderBlogList();
    } catch (err) {
      console.error('[NEPSOP] Failed to load blogs:', err);
      container.innerHTML = `
        <div class="col-12">
          <div class="blog-empty">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>Unable to load articles</h3>
            <p>Please try refreshing the page or check back later.</p>
          </div>
        </div>
      `;
    }
  }

  function renderRelatedBlogs(related) {
    const wrap = document.getElementById('relatedBlogs');
    if (!wrap || !related.length) return;

    wrap.innerHTML = related.map((blog) => {
      const category = getBlogCategory(blog);
      const blogUrl = `blog.html?id=${encodeURIComponent(blog.id)}&slug=${encodeURIComponent(blog.slug || '')}`;
      const image = blog.featured_image
        ? `<img src="${escapeHtml(blog.featured_image)}" alt="${escapeHtml(blog.title)}" loading="lazy">`
        : '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#fff3ef,#f5f5f4);color:#cd4629;font-size:2rem;"><i class="bi bi-journal-text"></i></div>';
      const snippet = truncateText(stripHtml(blog.excerpt || blog.content || ''), 120) || 'Explore practical advice and actionable insights.';

      return `
        <article class="blog-related-card">
          <div class="blog-related-image">${image}</div>
          <div class="blog-related-body">
            <div class="blog-related-meta">
              <span class="blog-related-tag">${escapeHtml(category)}</span>
              <span class="blog-related-date">${formatDate(blog.published_at || blog.created_at)}</span>
            </div>
            <h3><a href="${blogUrl}">${escapeHtml(blog.title)}</a></h3>
            <p>${escapeHtml(snippet)}</p>
            <a href="${blogUrl}" class="blog-related-link">Read More <i class="bi bi-arrow-right"></i></a>
          </div>
        </article>
      `;
    }).join('');
  }

  async function loadRelatedBlogs(currentBlogId) {
    try {
      const { data, error } = await window.NEPSOP_SUPABASE
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .neq('id', currentBlogId)
        .order('published_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        renderRelatedBlogs(data);
      }
    } catch (err) {
      console.warn('[NEPSOP] Related blogs not available:', err);
    }
  }

  function renderShareButtons(title) {
    const shareWrap = document.querySelector('.blog-detail-share');
    if (!shareWrap) return;

    const currentUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(title);
    const shareLinks = [
      { label: 'Facebook', icon: 'bi-facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}` },
      { label: 'WhatsApp', icon: 'bi-whatsapp', url: `https://wa.me/?text=${shareTitle}%20${currentUrl}` },
      { label: 'LinkedIn', icon: 'bi-linkedin', url: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}` },
      { label: 'Copy', icon: 'bi-link-45deg', url: '#copy' },
    ];

    shareWrap.innerHTML = `
      <span>Share:</span>
      ${shareLinks.map((item) => {
        const isCopy = item.url === '#copy';
        return `<a class="blog-share-btn" href="${item.url}" target="${isCopy ? '_self' : '_blank'}" rel="noopener noreferrer" aria-label="${item.label}" title="${item.label}" ${isCopy ? 'data-copy-link="true"' : ''}><i class="bi ${item.icon}"></i></a>`;
      }).join('')}
    `;

    const copyBtn = shareWrap.querySelector('[data-copy-link="true"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', async function (event) {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(window.location.href);
          const previous = this.innerHTML;
          this.innerHTML = '<i class="bi bi-check2"></i>';
          setTimeout(() => { this.innerHTML = previous; }, 1200);
        } catch (err) {
          console.warn('[NEPSOP] Copy link failed:', err);
        }
      });
    }
  }

  function buildTableOfContents() {
    const article = document.querySelector('.blog-detail-content');
    const tocWrapper = document.querySelector('.blog-toc-wrap .blog-toc');
    if (!article || !tocWrapper) return;

    const headings = Array.from(article.querySelectorAll('h2, h3'));
    if (headings.length < 2) {
      tocWrapper.innerHTML = '<h3>In This Article</h3><ul><li><a href="#top"><span class="blog-toc-number">01</span><span>Overview</span></a></li></ul>';
      return;
    }

    headings.forEach((heading, index) => {
      const id = heading.id || `section-${index + 1}`;
      heading.id = id;
    });

    tocWrapper.innerHTML = `
      <h3>In This Article</h3>
      <ul>
        ${headings.map((heading, index) => `<li><a href="#${heading.id}"><span class="blog-toc-number">${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(heading.textContent.trim())}</span></a></li>`).join('')}
      </ul>
    `;

    const tocLinks = tocWrapper.querySelectorAll('a');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
      }, { rootMargin: '-20% 0px -60% 0px', threshold: [0.2, 0.5, 0.8] });

      headings.forEach((heading) => observer.observe(heading));
    }
  }

  async function loadBlogDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const slug = params.get('slug');

    if (!id && !slug) {
      showNotFound();
      return;
    }

    const container = document.getElementById('blog-content');

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

      const breadcrumbTitle = document.getElementById('breadcrumbTitle');
      if (breadcrumbTitle) breadcrumbTitle.textContent = data.title;

      const category = getBlogCategory(data);
      const intro = data.excerpt ? escapeHtml(data.excerpt) : 'Explore practical advice and insights from nep.SOP.';
      const image = data.featured_image
        ? `<img src="${escapeHtml(data.featured_image)}" alt="${escapeHtml(data.title)}" class="blog-detail-featured-img" loading="eager">`
        : '';
      const authorText = data.author ? escapeHtml(data.author) : 'nep.SOP Team';
      const readingTime = estimateReadingTime(data);
      const articleHtml = data.content || '<p>No content available.</p>';
      const shareTitle = `${data.title} | nep.SOP`;

      container.innerHTML = `
        <div class="blog-detail-shell">
          <div class="blog-detail-main">
            <article class="blog-detail-article">
              <div class="blog-detail-header">
                <div class="blog-detail-eyebrow">${escapeHtml(category)}</div>
                <h1 class="blog-detail-title">${escapeHtml(data.title)}</h1>
                <p class="blog-detail-intro">${intro}</p>
                <div class="blog-detail-meta">
                  <span><i class="bi bi-person"></i> By ${authorText}</span>
                  <span><i class="bi bi-calendar3"></i> ${formatDate(data.published_at || data.created_at)}</span>
                  <span><i class="bi bi-clock"></i> ${readingTime}</span>
                </div>
              </div>

              <div class="blog-detail-featured-wrap">${image}</div>

              <div class="blog-detail-highlight">
                <h3>Quick Takeaway</h3>
                <p>${intro}</p>
              </div>

              <div class="blog-detail-content">${articleHtml}</div>

              <div class="blog-detail-footer">
                <div class="blog-detail-share">Share:</div>
                <a href="blogs.html" class="blog-back-link"><i class="bi bi-arrow-left"></i> Back to All Blogs</a>
              </div>
            </article>

            <div class="blog-detail-related">
              <div class="blog-related-header">
                <h2>You May Also Like</h2>
              </div>
              <div class="blog-related-grid" id="relatedBlogs"></div>
            </div>

            <div class="blog-detail-cta">
              <div>
                <h3>Need Help With Your SOP?</h3>
                <p>Get a personalized, professionally written Statement of Purpose tailored to your academic goals and study destination.</p>
              </div>
              <a class="cta-button" href="index.html#contact">Get Started Now <i class="bi bi-arrow-right"></i></a>
            </div>
          </div>

          <aside class="blog-toc-wrap">
            <div class="blog-toc">
              <h3>In This Article</h3>
              <ul>
                <li><a href="#overview"><span class="blog-toc-number">01</span><span>Overview</span></a></li>
              </ul>
            </div>
          </aside>
        </div>
      `;

      renderShareButtons(shareTitle);
      buildTableOfContents();
      await loadRelatedBlogs(data.id);
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

  function init() {
    const filters = document.getElementById('blogFilters');
    if (filters) {
      bindFilters();
    }

    loadBlogList('blogList', 'No blog posts published yet. Check back soon!');
  }

  NEPSOP_PUBLIC.blogs = {
    init,
    loadBlogList,
    loadBlogDetail,
    formatDate,
  };
})();
