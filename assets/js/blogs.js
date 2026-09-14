/**
 * Admin Blogs Module
 * Handles CRUD operations for blog posts via Supabase.
 */
(function () {
  'use strict';

  const NEPSOP = (window.NEPSOP = window.NEPSOP || {});

  /**
   * Fetch all blogs (admin view — includes drafts).
   */
  async function getAllBlogs() {
    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NEPSOP Blogs] Fetch all error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Fetch a single blog by ID.
   */
  async function getBlogById(id) {
    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[NEPSOP Blogs] Fetch by ID error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Fetch a single published blog by slug (public).
   */
  async function getBlogBySlug(slug) {
    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('[NEPSOP Blogs] Fetch by slug error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Fetch all published blogs (public).
   */
  async function getPublishedBlogs() {
    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[NEPSOP Blogs] Fetch published error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Create a new blog post.
   */
  async function createBlog(blog) {
    const now = new Date().toISOString();
    const insertData = {
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      featured_image: blog.featured_image || '',
      author: blog.author || '',
      status: blog.status || 'draft',
      published_at: blog.status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[NEPSOP Blogs] Create error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Update an existing blog post.
   */
  async function updateBlog(id, blog) {
    const now = new Date().toISOString();
    const updateData = {
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      featured_image: blog.featured_image || '',
      author: blog.author || '',
      status: blog.status || 'draft',
      updated_at: now,
    };

    // Set published_at when publishing
    if (blog.status === 'published') {
      updateData.published_at = blog.published_at || now;
    }

    const { data, error } = await NEPSOP.supabase
      .from('blogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[NEPSOP Blogs] Update error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Delete a blog post.
   */
  async function deleteBlog(id) {
    const { error } = await NEPSOP.supabase.from('blogs').delete().eq('id', id);

    if (error) {
      console.error('[NEPSOP Blogs] Delete error:', error);
      throw error;
    }
    return true;
  }

  /**
   * Generate a URL-friendly slug from a title.
   */
  function generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Format a date string for display.
   */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  NEPSOP.blogs = {
    getAllBlogs,
    getBlogById,
    getBlogBySlug,
    getPublishedBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    generateSlug,
    formatDate,
    escapeHtml,
  };
})();
