export type ReferralNetwork = 'rakuten' | 'indeals';

export type ProductListing = {
  id: string;
  retailer: string;
  title: string;
  url: string;
  referralNetwork?: ReferralNetwork | null;
};

function encodeQuery(query: string): string {
  return encodeURIComponent(query.trim());
}

/**
 * Builds retailer search links for a recognized product.
 * URLs are search-based (not hallucinated product pages). Ready for Rakuten / Indeals
 * referral wrapping via env when accounts are connected.
 */
export function buildProductListings(objectName: string, locale: string): ProductListing[] {
  const query = encodeQuery(objectName);
  const region = locale.split('-')[1]?.toUpperCase() ?? 'US';

  let listings: ProductListing[];

  if (region === 'IN') {
    listings = [
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
  } else if (region === 'GB') {
    listings = [
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
  } else {
    listings = [
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

  return applyReferralWrappers(listings).slice(0, 3);
}

function applyReferralWrappers(listings: ProductListing[]): ProductListing[] {
  const rakutenId = process.env.RAKUTEN_AFFILIATE_ID;
  const indealsId = process.env.INDEALS_AFFILIATE_ID;

  if (!rakutenId && !indealsId) {
    return listings;
  }

  return listings.map(listing => {
    if (rakutenId && listing.retailer === 'Amazon') {
      return {
        ...listing,
        url: `https://click.linksynergy.com/deeplink?id=${rakutenId}&url=${encodeURIComponent(listing.url)}`,
        referralNetwork: 'rakuten' as const,
      };
    }

    if (indealsId && listing.retailer === 'Flipkart') {
      return {
        ...listing,
        url: `${listing.url}${listing.url.includes('?') ? '&' : '?'}ref=${indealsId}`,
        referralNetwork: 'indeals' as const,
      };
    }

    return listing;
  });
}
