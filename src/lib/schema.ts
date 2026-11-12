import { ADDRESS, CONTACT, SITE } from '~/data/site';

/**
 * Dados estruturados do escritório (JSON-LD).
 * O tipo LegalService é o que o Google usa para resultados locais, e é o que
 * sustenta a busca por "advogado em Palhoça".
 */
export function legalServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${siteUrl}/#escritorio`,
    name: SITE.legalName,
    alternateName: SITE.name,
    description: SITE.description,
    url: siteUrl,
    telephone: CONTACT.phoneRaw,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${ADDRESS.street}, ${ADDRESS.district}`,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.state,
      postalCode: ADDRESS.zip,
      addressCountry: ADDRESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: ADDRESS.lat,
      longitude: ADDRESS.lon,
    },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    sameAs: [CONTACT.instagram],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00',
    },
  };
}

/** Dados estruturados de uma publicação. */
export function articleSchema(opts: {
  siteUrl: string;
  url: string;
  title: string;
  description: string;
  image: string;
  published: Date;
  authorName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    image: opts.image,
    datePublished: opts.published.toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    author: { '@type': 'Person', name: opts.authorName },
    publisher: {
      '@type': 'Organization',
      name: SITE.legalName,
      '@id': `${opts.siteUrl}/#escritorio`,
    },
  };
}

/** Trilha de navegação em JSON-LD, a partir dos mesmos dados do breadcrumb visual. */
export function breadcrumbSchema(siteUrl: string, trail: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };
}
