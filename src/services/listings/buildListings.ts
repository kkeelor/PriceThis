import type { ProductListing } from '@/types/scan';
import { getDeviceLocale } from '@/services/locale/currency';

function encodeQuery(query: string): string {
  return encodeURIComponent(query.trim());
}

export function buildProductListings(
  objectName: string,
  locale = getDeviceLocale(),
): ProductListing[] {
  const query = encodeQuery(objectName);
  const region = locale.split('-')[1]?.toUpperCase() ?? 'US';

  if (region === 'IN') {
    return [
      {
        id: 'amazon-in',
        retailer: 'Amazon',
        title: 'Search on Amazon.in',
        url: `https://www.amazon.in/s?k=${query}`,
      },
      {
        id: 'flipkart',
        retailer: 'Flipkart',
        title: 'Search on Flipkart',
        url: `https://www.flipkart.com/search?q=${query}`,
      },
      {
        id: 'ebay',
        retailer: 'eBay',
        title: 'Search on eBay',
        url: `https://www.ebay.com/sch/i.html?_nkw=${query}`,
      },
    ];
  }

  if (region === 'GB') {
    return [
      {
        id: 'amazon-uk',
        retailer: 'Amazon',
        title: 'Search on Amazon UK',
        url: `https://www.amazon.co.uk/s?k=${query}`,
      },
      {
        id: 'ebay-uk',
        retailer: 'eBay',
        title: 'Search on eBay UK',
        url: `https://www.ebay.co.uk/sch/i.html?_nkw=${query}`,
      },
      {
        id: 'google-shopping',
        retailer: 'Google',
        title: 'Compare prices',
        url: `https://www.google.co.uk/search?tbm=shop&q=${query}`,
      },
    ];
  }

  return [
    {
      id: 'amazon',
      retailer: 'Amazon',
      title: 'Search on Amazon',
      url: `https://www.amazon.com/s?k=${query}`,
    },
    {
      id: 'ebay',
      retailer: 'eBay',
      title: 'Search on eBay',
      url: `https://www.ebay.com/sch/i.html?_nkw=${query}`,
    },
    {
      id: 'google-shopping',
      retailer: 'Google',
      title: 'Compare prices',
      url: `https://www.google.com/search?tbm=shop&q=${query}`,
    },
  ];
}

export function resolveListings(
  objectName: string,
  listings?: ProductListing[],
): ProductListing[] {
  if (listings && listings.length > 0) {
    return listings.slice(0, 3);
  }
  return buildProductListings(objectName);
}
