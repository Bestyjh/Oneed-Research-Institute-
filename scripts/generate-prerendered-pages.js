const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.oneedinstitute.ca';
const DEFAULT_TITLE = 'Oneed Research Institute';
const DEFAULT_DESCRIPTION =
  'Empowering Global Education Through Research, Innovation, and Inclusion.';
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/remote-favicon-preview.png`;
const DEFAULT_KEYWORDS = [
  'Oneed Research Institute',
  'education research institute Canada',
  'professional training Canada',
  'research conferences',
  'grants and scholarships',
  'education for all',
  'inclusive education'
];

const ROUTE_SEO = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: [
      'education research institute Canada',
      'training and conferences Canada',
      'scholarships and grants Canada',
      'London Ontario education institute'
    ]
  },
  '/about': {
    title: 'About | Oneed Research Institute',
    description: 'Learn about Oneed Research Institute mission, leadership, and global education impact.',
    keywords: ['about oneed institute', 'education institute mission', 'research institute leadership']
  },
  '/research': {
    title: 'Research | Oneed Research Institute',
    description: 'Explore Oneed research programs, impact projects, and innovation archives.',
    keywords: ['education research programs', 'impact research projects', 'research archive']
  },
  '/conferences': {
    title: 'Conferences | Oneed Research Institute',
    description: 'Join Oneed conferences, seminars, and international education events.',
    keywords: ['education conferences', 'research seminars', 'international education events']
  },
  '/grants': {
    title: 'Grants & Scholarships | Oneed Research Institute',
    description: 'Find grants and scholarship opportunities that support inclusive learning and research.',
    keywords: ['education grants', 'student scholarships', 'research funding opportunities']
  },
  '/awards': {
    title: 'Awards | Oneed Research Institute',
    description: 'Discover Oneed awards recognizing excellence in research and education.',
    keywords: ['research excellence awards', 'education awards', 'academic recognition programs']
  },
  '/services': {
    title: 'Services | Oneed Research Institute',
    description: 'See Oneed services including training, consulting, and professional development support.',
    keywords: ['professional development training', 'education consulting services', 'skills workshops Canada']
  },
  '/faq': {
    title: 'FAQ | Oneed Research Institute',
    description: 'Answers to common questions about programs, admissions, and support at Oneed.',
    keywords: ['oneed faq', 'program admissions questions', 'student support answers']
  },
  '/blog': {
    title: 'Blog | Oneed Research Institute',
    description: 'Insights, updates, and learning resources from Oneed Research Institute.',
    keywords: ['education blog Canada', 'research insights', 'learning resources']
  },
  '/contact': {
    title: 'Contact | Oneed Research Institute',
    description: 'Request a consultation and contact Oneed Research Institute.',
    keywords: ['contact oneed institute', 'education consultation Canada', 'research partnership inquiry']
  }
};

const ROUTE_LABELS = {
  '/': 'Home',
  '/about': 'About',
  '/research': 'Research',
  '/conferences': 'Conferences',
  '/grants': 'Grants & Scholarships',
  '/awards': 'Awards',
  '/services': 'Services',
  '/faq': 'FAQ',
  '/blog': 'Blog',
  '/contact': 'Contact'
};

const blogPosts = require('../src/data/blogPosts.json');
const FAQ_ITEMS = [
  {
    q: 'Who does Oneed Institute serve?',
    a: 'Students, educators, institutions, and organizations seeking research-driven learning and professional development.'
  },
  {
    q: 'What programs do you offer?',
    a: 'Short courses, certifications, diploma pathways, workshops, conferences, and training initiatives.'
  },
  {
    q: 'Do you partner with institutions?',
    a: 'Yes. We collaborate with universities, colleges, and secondary schools in Canada and internationally.'
  },
  {
    q: 'How do we start a partnership?',
    a: 'Submit an inquiry and we will respond with a tailored roadmap within one business day.'
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function canonicalFor(pathname) {
  return pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
}

function upsertTag(html, pattern, tag) {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `${tag}</head>`);
}

function buildJsonLd(pathname, seo, post) {
  const canonical = canonicalFor(pathname);
  const breadcrumbItems = [{ name: 'Home', item: `${SITE_URL}/` }];
  if (pathname !== '/') {
    if (pathname.startsWith('/blog/') && post) {
      breadcrumbItems.push({ name: 'Blog', item: `${SITE_URL}/blog` });
      breadcrumbItems.push({ name: post.title, item: canonical });
    } else {
      breadcrumbItems.push({
        name: ROUTE_LABELS[pathname] || (seo.title || DEFAULT_TITLE).split('|')[0].trim(),
        item: canonical
      });
    }
  }

  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': ['EducationalOrganization', 'LocalBusiness'],
      name: 'Oneed Research Institute',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      telephone: '+1-226-753-2321',
      email: 'info@oneedinstitute.ca',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '215 Platts Lane',
        addressLocality: 'London',
        addressRegion: 'ON',
        addressCountry: 'CA'
      },
      sameAs: ['https://www.facebook.com/profile.php?id=61586815105340']
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Oneed Research Institute',
      url: SITE_URL
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seo.title || DEFAULT_TITLE,
      description: seo.description || DEFAULT_DESCRIPTION,
      url: canonical
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item
      }))
    }
  ];

  if (pathname === '/faq') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    });
  }

  if (pathname === '/blog') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Oneed Research Journal',
      url: `${SITE_URL}/blog`,
      blogPost: blogPosts.map((item) => ({
        '@type': 'BlogPosting',
        headline: item.title,
        url: `${SITE_URL}/blog/${item.slug}`,
        image: item.image ? [item.image] : undefined,
        thumbnailUrl: item.image || undefined
      }))
    });
  }

  if (post) {
    const parsed = new Date(post.date);
    const publishedIso = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || DEFAULT_DESCRIPTION,
      image: post.image ? [post.image] : undefined,
      thumbnailUrl: post.image || undefined,
      caption: post.imageAlt || undefined,
      datePublished: publishedIso,
      dateModified: publishedIso,
      mainEntityOfPage: canonical,
      author: {
        '@type': 'Organization',
        name: 'Oneed Research Institute'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Oneed Research Institute',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.svg`
        }
      }
    });
  }

  return JSON.stringify({ '@graph': graph });
}

function applySeo(html, pathname, seo, post) {
  const title = seo.title || DEFAULT_TITLE;
  const description = seo.description || DEFAULT_DESCRIPTION;
  const canonical = canonicalFor(pathname);
  const keywords = [...new Set([...(seo.keywords || []), ...DEFAULT_KEYWORDS])].join(', ');
  const jsonLd = buildJsonLd(pathname, seo, post);
  const ogType = seo.ogType || (post ? 'article' : 'website');
  const socialImage = seo.image || (post && post.image) || DEFAULT_SOCIAL_IMAGE;

  let output = html;
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = upsertTag(
    output,
    /<meta[^>]*name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*property="og:type"[^>]*>/i,
    `<meta property="og:type" content="${escapeHtml(ogType)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(title)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(description)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*property="og:image"[^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(socialImage)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="twitter:card"[^>]*>/i,
    '<meta name="twitter:card" content="summary_large_image">'
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="twitter:image"[^>]*>/i,
    `<meta name="twitter:image" content="${escapeHtml(socialImage)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="twitter:url"[^>]*>/i,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}">`
  );
  output = upsertTag(
    output,
    /<meta[^>]*name="keywords"[^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(keywords)}">`
  );
  output = upsertTag(
    output,
    /<link[^>]*rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`
  );
  output = output.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  output = output.replace(
    /<script[^>]*data-seo-jsonld="[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
  output = output.replace(
    '</head>',
    `<script type="application/ld+json" data-seo-jsonld-static="1">${jsonLd.replace(/<\/script/gi, '<\\/script')}</script></head>`
  );
  return output;
}

function writeRoutePage(buildDir, template, pathname, seo, post = null) {
  const routeHtml = applySeo(template, pathname, seo, post);
  const outputPath =
    pathname === '/'
      ? path.join(buildDir, 'index.html')
      : path.join(buildDir, pathname.replace(/^\//, ''), 'index.html');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, routeHtml);
  console.log(`Generated prerendered SEO page: ${pathname}`);
}

function main() {
  const buildDir = path.resolve(__dirname, '../build');
  const templatePath = path.join(buildDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Expected build index at ${templatePath}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');

  Object.entries(ROUTE_SEO).forEach(([pathname, seo]) => {
    writeRoutePage(buildDir, template, pathname, seo);
  });

  blogPosts.forEach((post) => {
    const pathname = `/blog/${post.slug}`;
    const seo = {
      title: `${post.title} | Oneed Research Institute`,
      description: post.excerpt || DEFAULT_DESCRIPTION,
      keywords: [post.title, 'education publication', 'research article'],
      ogType: 'article',
      image: post.image || DEFAULT_SOCIAL_IMAGE
    };
    writeRoutePage(buildDir, template, pathname, seo, post);
  });
}

main();
