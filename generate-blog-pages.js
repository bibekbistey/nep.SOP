/**
 * generate-blog-pages.js
 *
 * Build-time static blog generation for nep.SOP.
 *
 * - Fetches published blogs from Supabase (needs SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY).
 * - Generates a fully server-rendered static page at blogs/<slug>.html for every
 *   published article, so crawlers and AI agents can read article content without
 *   executing JavaScript (the JS-rendered blog.html?id= view remains as a fallback).
 * - Regenerates sitemap.xml (static pages + blog article URLs, with <lastmod>).
 * - Regenerates llms.txt with a machine-readable overview and article links.
 *
 * If Supabase env vars are missing (e.g. local dev without .env), blog generation
 * is skipped gracefully and only the static sitemap / llms.txt are refreshed.
 *
 * Usage: node generate-blog-pages.js   (also invoked by build.js)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const ROOT = __dirname;
const SITE_URL = 'https://nepsop.com.np';
const LOGO_URL = `${SITE_URL}/assets/img/neop.sop.png`;

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`[blog-gen] ${msg}`);
}

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readingTime(blog) {
  const words = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 180))} min read`;
}

function detectCategory(blog) {
  const haystack = `${blog.title || ''} ${blog.excerpt || ''} ${blog.content || ''}`.toLowerCase();
  if (/statement of purpose|sop writing|personal statement|sop/.test(haystack)) return 'SOP Writing';
  if (/study abroad|university|admission|application|international student|study/.test(haystack)) return 'Study Abroad';
  if (/visa|immigration|migration/.test(haystack)) return 'Visa Guide';
  if (/australia|canada|usa|uk|germany|malta|dependent|destination/.test(haystack)) return 'Destinations';
  return 'Tips & Guides';
}

/** Last commit date (ISO) for a file, falling back to file mtime. */
function fileLastmod(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (err) {
    // git not available — fall through to mtime
  }
  try {
    return new Date(fs.statSync(path.join(ROOT, file)).mtime).toISOString();
  } catch (err) {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Static sitemap entries (public, indexable pages)
// ---------------------------------------------------------------------------

const STATIC_PAGES = [
  ['index.html', 1.0],
  ['sop-writing-nepal.html', 0.9],
  ['australia-sop.html', 0.8],
  ['canada-sop.html', 0.8],
  ['usa-sop.html', 0.8],
  ['uk-sop.html', 0.8],
  ['germany-sop.html', 0.8],
  ['malta-sop.html', 0.8],
  ['dependent-visa-sop.html', 0.8],
  ['why-choose-nepsop.html', 0.6],
  ['experienced-sop-writers.html', 0.6],
  ['multi-country-sop-expertise.html', 0.6],
  ['plagiarism-free-sop-writing.html', 0.6],
  ['100-personalized-sop-writing.html', 0.6],
  ['sop-revisions.html', 0.5],
  ['sop-customer-support.html', 0.5],
  ['contact.html', 0.5],
  ['blogs.html', 0.5],
];

// ---------------------------------------------------------------------------
// Static blog page generation
// ---------------------------------------------------------------------------

function generateBlogPage(blog) {
  const slug = blog.slug || slugify(blog.title) || String(blog.id);
  const url = `${SITE_URL}/blogs/${encodeURIComponent(slug)}.html`;
  const title = blog.title || 'Blog | nep.SOP';
  const description = stripHtml(blog.excerpt || '').slice(0, 155) || `${title} — insights from nep.SOP, Nepal's SOP writing agency.`;
  const category = detectCategory(blog);
  const author = blog.author || 'nep.SOP Team';
  const published = isoDate(blog.published_at || blog.created_at);
  const updated = isoDate(blog.updated_at || blog.published_at || blog.created_at);
  const publishedFmt = formatDate(blog.published_at || blog.created_at);
  const updatedFmt = formatDate(blog.updated_at || blog.published_at || blog.created_at);
  const image = blog.featured_image || LOGO_URL;
  const readTime = readingTime(blog);
  const content = blog.content || '<p>No content available.</p>';

  // Build from the blog.html template so the design stays pixel-consistent.
  const template = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');

  let html = template;

  // -- head meta -------------------------------------------------------------
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(title)} | nep.SOP Blog</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(description)}">`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${url}">`
  );
  html = html.replace(
    /<meta name="robots" content="[^"]*">/,
    `<meta name="robots" content="index, follow">`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${url}">`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeHtml(title)}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeHtml(description)}">`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeHtml(image)}">`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`
  );

  // -- JSON-LD: BlogPosting + BreadcrumbList ---------------------------------
  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "image": ${JSON.stringify(image)},
    "datePublished": ${JSON.stringify(published)},
    "dateModified": ${JSON.stringify(updated)},
    "inLanguage": "en",
    "articleSection": ${JSON.stringify(category)},
    "author": { "@type": "Person", "name": ${JSON.stringify(author)} },
    "publisher": {
      "@type": "Organization",
      "name": "nep.SOP",
      "logo": { "@type": "ImageObject", "url": ${JSON.stringify(LOGO_URL)} }
    },
    "mainEntityOfPage": ${JSON.stringify(url)},
    "wordCount": ${String(content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length)}
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}/index.html" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "${SITE_URL}/blogs.html" },
      { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(title)}, "item": ${JSON.stringify(url)} }
    ]
  }
  </script>
  `;
  html = html.replace('<!-- Google Analytics 4 (GA4) -->', jsonLd + '\n  <!-- Google Analytics 4 (GA4) -->');

  // -- breadcrumb -------------------------------------------------------------
  html = html.replace(
    /<span id="breadcrumbTitle">[\s\S]*?<\/span>/,
    `<span>${escapeHtml(title)}</span>`
  );

  // -- article body -----------------------------------------------------------
  const featuredImage = blog.featured_image
    ? `<img src="${escapeHtml(blog.featured_image)}" alt="${escapeHtml(title)}" class="blog-detail-featured-img" loading="eager">`
    : '';
  const updatedMarkup =
    updatedFmt && updatedFmt !== publishedFmt
      ? `<span><i class="bi bi-clock-history"></i> Last updated: ${escapeHtml(updatedFmt)}</span>`
      : `<span><i class="bi bi-clock"></i> ${escapeHtml(readTime)}</span>`;

  const articleHtml = `
        <div class="blog-detail-shell">
          <div class="blog-detail-main">
            <article class="blog-detail-article">
              <div class="blog-detail-header">
                <div class="blog-detail-eyebrow">${escapeHtml(category)}</div>
                <h1 class="blog-detail-title">${escapeHtml(title)}</h1>
                <p class="blog-detail-intro">${escapeHtml(stripHtml(blog.excerpt || ''))}</p>
                <div class="blog-detail-meta">
                  <span><i class="bi bi-person"></i> By ${escapeHtml(author)}</span>
                  <span><i class="bi bi-calendar3"></i> ${escapeHtml(publishedFmt)}</span>
                  ${updatedMarkup}
                </div>
              </div>

              <div class="blog-detail-featured-wrap">${featuredImage}</div>

              <div class="blog-detail-highlight">
                <h3>Quick Takeaway</h3>
                <p>${escapeHtml(stripHtml(blog.excerpt || ''))}</p>
              </div>

              <div class="blog-detail-content">${content}</div>

              <div class="blog-detail-footer">
                <div class="blog-detail-share">
                  <span>Share:</span>
                  <a class="blog-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook"><i class="bi bi-facebook"></i></a>
                  <a class="blog-share-btn" href="https://wa.me/?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>
                  <a class="blog-share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><i class="bi bi-linkedin"></i></a>
                </div>
                <a href="../blogs.html" class="blog-back-link"><i class="bi bi-arrow-left"></i> Back to All Blogs</a>
              </div>
            </article>

            <div class="blog-detail-cta">
              <div>
                <h3>Need Help With Your SOP?</h3>
                <p>Get a personalized, professionally written Statement of Purpose tailored to your academic goals and study destination.</p>
              </div>
              <a class="cta-button" href="../index.html#contact">Get Started Now <i class="bi bi-arrow-right"></i></a>
            </div>
          </div>

          <aside class="blog-toc-wrap">
            <div class="blog-toc">
              <h3>In This Article</h3>
              <ul>
                <li><a href="#top"><span class="blog-toc-number">01</span><span>Overview</span></a></li>
              </ul>
            </div>
          </aside>
        </div>
  `;

  // Replace the JS-loaded detail wrapper with the static article.
  html = html.replace(
    /<div class="blog-detail-wrapper" id="blog-content">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
    `<div class="blog-detail-wrapper">${articleHtml}</div>\n    </div>\n  </section>`
  );

  // Remove Supabase runtime scripts + the JS detail loader (content is static).
  html = html.replace(
    /  <!-- Supabase JS -->[\s\S]*?<\/script>\s*<\/script>\s*<\/script>\s*<\/script>\s*<\/script>\s*<\/script>\s*<\/script>[\s\S]*?<\/script>\s*<\/script>[\s\S]*?<\/script>/,
    ''
  );

  // Fix relative asset paths (generated pages live one level deeper, in /blogs/).
  html = html.replace(/(href|src)="assets\//g, '$1="../assets/');
  html = html.replace(
    /href="(?!https?:|#|mailto:|tel:|wa\.me|\.\.\/|assets\/)([^"]*\.html[^"]*)"/g,
    'href="../$1"'
  );

  return html;
}

// ---------------------------------------------------------------------------
// Sitemap generation
// ---------------------------------------------------------------------------

function generateSitemap(blogs) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

  for (const [file, priority] of STATIC_PAGES) {
    const loc = file === 'index.html' ? `${SITE_URL}/` : `${SITE_URL}/${file}`;
    const lastmod = fileLastmod(file);
    lines.push('  <url>');
    lines.push(`    <loc>${loc}</loc>`);
    if (lastmod) lines.push(`    <lastmod>${lastmod.slice(0, 10)}</lastmod>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push('  </url>');
  }

  for (const blog of blogs) {
    const slug = blog.slug || slugify(blog.title) || String(blog.id);
    const lastmod = isoDate(blog.updated_at || blog.published_at || blog.created_at);
    lines.push('  <url>');
    lines.push(`    <loc>${SITE_URL}/blogs/${encodeURIComponent(slug)}.html</loc>`);
    if (lastmod) lines.push(`    <lastmod>${lastmod.slice(0, 10)}</lastmod>`);
    lines.push('    <priority>0.7</priority>');
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// llms.txt generation
// ---------------------------------------------------------------------------

function generateLlmsTxt(blogs) {
  const lines = [];
  lines.push('# nep.SOP');
  lines.push('');
  lines.push('> Professional Statement of Purpose (SOP) writing services in Nepal. nep.SOP writes personalized, plagiarism-free SOPs for university admission, student visas, scholarships, and more — for Australia, Canada, USA, UK, Germany, Malta, and dependent visas.');
  lines.push('');
  lines.push('## About');
  lines.push('');
  lines.push(`nep.SOP is a Kathmandu-based SOP writing agency with ${'11,000+'} successful students. Every SOP is written from scratch, tailored to the applicant's academic background and the target university/visa requirements, and delivered with revisions and 24/7 support.`);
  lines.push('');
  lines.push('## Key Pages');
  lines.push('');
  lines.push('- [SOP Writing Services in Nepal](' + SITE_URL + '/sop-writing-nepal.html)');
  lines.push('- [Australia SOP](' + SITE_URL + '/australia-sop.html)');
  lines.push('- [Canada SOP](' + SITE_URL + '/canada-sop.html)');
  lines.push('- [USA SOP](' + SITE_URL + '/usa-sop.html)');
  lines.push('- [UK SOP](' + SITE_URL + '/uk-sop.html)');
  lines.push('- [Germany SOP](' + SITE_URL + '/germany-sop.html)');
  lines.push('- [Malta SOP](' + SITE_URL + '/malta-sop.html)');
  lines.push('- [Dependent Visa SOP](' + SITE_URL + '/dependent-visa-sop.html)');
  lines.push('- [Why Choose nep.SOP](' + SITE_URL + '/why-choose-nepsop.html)');
  lines.push('- [Experienced SOP Writers](' + SITE_URL + '/experienced-sop-writers.html)');
  lines.push('- [Multi-Country Expertise](' + SITE_URL + '/multi-country-sop-expertise.html)');
  lines.push('- [Plagiarism-Free SOP Writing](' + SITE_URL + '/plagiarism-free-sop-writing.html)');
  lines.push('- [100% Personalized SOPs](' + SITE_URL + '/100-personalized-sop-writing.html)');
  lines.push('- [SOP Revisions](' + SITE_URL + '/sop-revisions.html)');
  lines.push('- [SOP Customer Support](' + SITE_URL + '/sop-customer-support.html)');
  lines.push('- [Contact](' + SITE_URL + '/contact.html)');
  lines.push('');
  lines.push('## Blog');
  lines.push('');
  lines.push('- [All Articles](' + SITE_URL + '/blogs.html)');
  for (const blog of blogs) {
    const slug = blog.slug || slugify(blog.title) || String(blog.id);
    lines.push(`- [${blog.title}](${SITE_URL}/blogs/${encodeURIComponent(slug)}.html)`);
  }
  lines.push('');
  lines.push('## Contact');
  lines.push('');
  lines.push('- Email: info@nepsop.com.np');
  lines.push('- Phone / WhatsApp: +977-9861935709');
  lines.push('- Website: https://nepsop.com.np');
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let blogs = [];

  if (!supabaseUrl || !supabaseKey) {
    log('SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set — skipping static blog generation (local dev).');
  } else {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      blogs = data || [];
      log(`Fetched ${blogs.length} published blog(s).`);

      const blogsDir = path.join(ROOT, 'blogs');
      fs.mkdirSync(blogsDir, { recursive: true });

      // Remove previously generated static pages so unpublished/deleted posts don't linger.
      for (const file of fs.readdirSync(blogsDir)) {
        if (file.endsWith('.html')) fs.unlinkSync(path.join(blogsDir, file));
      }

      const manifest = { slugs: [] };
      for (const blog of blogs) {
        const slug = blog.slug || slugify(blog.title) || String(blog.id);
        const html = generateBlogPage(blog);
        fs.writeFileSync(path.join(blogsDir, `${slug}.html`), html, 'utf8');
        manifest.slugs.push(slug);
        log(`Generated blogs/${slug}.html`);
      }
      fs.writeFileSync(path.join(blogsDir, 'manifest.json'), JSON.stringify(manifest), 'utf8');
      log('Generated blogs/manifest.json');
    } catch (err) {
      console.error('[blog-gen] Static blog generation failed:', err.message);
      process.exitCode = 1;
    }
  }

  // Sitemap + llms.txt always refresh (static pages only when Supabase is unavailable).
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), generateSitemap(blogs), 'utf8');
  log('Regenerated sitemap.xml');

  fs.writeFileSync(path.join(ROOT, 'llms.txt'), generateLlmsTxt(blogs), 'utf8');
  log('Regenerated llms.txt');
}

main();