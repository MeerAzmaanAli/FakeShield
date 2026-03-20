const axios = require('axios');

const FACEBOOK_GRAPH_API = 'https://graph.facebook.com/v18.0';
const FACEBOOK_RAPID_API_BASE = 'https://facebook-scraper3.p.rapidapi.com';

/**
 * Fetch Facebook profile data
 * Note: Facebook Graph API has strict limitations:
 * - Cannot look up arbitrary users by username
 * - Requires user to authenticate via Facebook Login
 * - Only returns data the user has permitted the app to access
 *
 * For public page data, you can use Page Access Tokens
 * @param {string} identifierOrUrl - Facebook username, user ID, page ID, or URL
 * @returns {Promise<object>} Profile data
 */
exports.getFacebookProfile = async (identifierOrUrl) => {
  // Try RapidAPI Facebook scraper first
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (rapidApiKey) {
    try {
      return await getFacebookViaRapidAPI(identifierOrUrl, rapidApiKey);
    } catch (error) {
      console.log('RapidAPI Facebook fetch failed:', error.message);
    }
  }

  // Fallback to Graph API (limited functionality)
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Facebook API not configured. Set RAPIDAPI_KEY or FACEBOOK_ACCESS_TOKEN in environment.');
  }

  const graphIdentifier = extractGraphIdentifier(identifierOrUrl);
  if (!graphIdentifier) {
    throw new Error('Could not resolve a Facebook page identifier from the provided URL/input.');
  }

  try {
    // Try to fetch as a Page (pages can be accessed with app tokens)
    const response = await axios.get(
      `${FACEBOOK_GRAPH_API}/${graphIdentifier}`,
      {
        params: {
          fields: 'id,name,fan_count,followers_count,about,picture,verification_status,is_verified',
          access_token: accessToken
        }
      }
    );

    const data = response.data;

    return {
      username: graphIdentifier,
      name: data.name || graphIdentifier,
      bio: data.about || '',
      profilePicUrl: data.picture?.data?.url,
      isVerified: data.is_verified || data.verification_status === 'blue_verified',
      isPrivate: false, // Pages are public
      followerCount: toInt(data.followers_count ?? data.fan_count, 0),
      followingCount: 0, // Pages don't have following count
      postCount: 0, // Requires additional API calls
      accountAgeDays: 365, // Not easily available
      bioLength: (data.about || '').length,
      hasProfilePic: !!data.picture?.data?.url,
      platform: 'facebook',
      isPage: true,
      communityCount: null,
      urlsShared: null,
      photosVideos: null,
      avgComments: null,
      likesPerPost: null,
      tagsPerPost: null,
      numTagsPerPost: null,
      raw: data
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Facebook access token');
    }
    if (error.response?.status === 404 || error.response?.data?.error?.code === 803) {
      throw new Error('Facebook user/page not found or not accessible');
    }
    throw error;
  }
};

/**
 * Fetch Facebook profile via RapidAPI
 */
async function getFacebookViaRapidAPI(identifierOrUrl, apiKey) {
  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com'
  };

  const lookupQuery = extractLookupQuery(identifierOrUrl);
  const profileUrl = normalizeFacebookProfileUrl(identifierOrUrl);

  // 1) Direct single-page lookup endpoint.
  const directDetails = await fetchPageDetails(profileUrl, headers);
  if (directDetails) {
    return mapFacebookDetailsResult(directDetails, { profileUrl, lookupQuery });
  }

  // 2) Search pages, pick the closest match, then resolve details endpoint.
  const pageResults = await fetchSearchResults('/search/pages', lookupQuery, headers);
  const bestPage = pickBestFacebookResult(pageResults, lookupQuery, profileUrl);

  if (bestPage) {
    const bestPageUrl = bestPage.url || bestPage.profile_url || profileUrl;
    const bestDetails = await fetchPageDetails(bestPageUrl, headers);
    if (bestDetails) {
      return mapFacebookDetailsResult(bestDetails, {
        profileUrl: bestPageUrl,
        lookupQuery
      });
    }
    return mapFacebookSearchResult(bestPage, {
      profileUrl: bestPageUrl,
      lookupQuery,
      isPage: true
    });
  }

  // 3) Fallback for personal-profile lookups when only people search is available.
  const peopleResults = await fetchSearchResults('/search/people', lookupQuery, headers);
  const bestPerson = pickBestFacebookResult(peopleResults, lookupQuery, profileUrl);

  if (bestPerson) {
    return mapFacebookSearchResult(bestPerson, {
      profileUrl: bestPerson.url || bestPerson.profile_url || profileUrl,
      lookupQuery,
      isPage: false
    });
  }

  throw new Error('Facebook user/page not found');
}

async function fetchPageDetails(profileUrl, headers) {
  if (!profileUrl) return null;

  const data = await rapidGet('/page/details', { url: profileUrl }, headers, true);
  const details = data?.results || data;

  if (!details || details.type === 'not_page') {
    return null;
  }

  return details;
}

async function fetchSearchResults(path, query, headers) {
  if (!query) return [];

  const data = await rapidGet(path, { query }, headers, true);
  if (!data || !Array.isArray(data.results)) {
    return [];
  }

  return data.results;
}

async function rapidGet(path, params, headers, allowNotFound = false) {
  try {
    const response = await axios.get(`${FACEBOOK_RAPID_API_BASE}${path}`, {
      headers,
      params
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (allowNotFound && status === 404) {
      return null;
    }
    if (status === 401 || status === 403) {
      throw new Error('Invalid RapidAPI key or missing subscription for facebook-scraper3.');
    }
    if (status === 429) {
      throw new Error('RapidAPI rate limit exceeded for facebook-scraper3.');
    }

    throw new Error(`RapidAPI request failed (${status || 'unknown'}): ${message}`);
  }
}

function mapFacebookDetailsResult(data, context = {}) {
  const sourceUrl = data.url || context.profileUrl || '';
  const username = extractFacebookUsername(sourceUrl) || sanitizeLookup(context.lookupQuery) || 'facebook-user';
  const bio = data.intro || data.about || '';
  const profilePicUrl = getProfilePictureUrl(data);

  return {
    username,
    name: data.name || username,
    bio,
    profilePicUrl,
    isVerified: Boolean(data.verified ?? data.is_verified),
    isPrivate: false,
    followerCount: toInt(data.followers ?? data.followers_count ?? data.likes, 0),
    followingCount: toInt(data.following ?? data.following_count, 0),
    postCount: toInt(data.posts_count ?? data.post_count ?? data.posts, 0),
    accountAgeDays: 365, // Not exposed consistently by this API
    bioLength: bio.length,
    hasProfilePic: !!profilePicUrl,
    platform: 'facebook',
    isPage: true,
    communityCount: Array.isArray(data.categories)
      ? data.categories.length
      : toNullableInt(data.community_count),
    urlsShared: toNullableInt(data.urls_shared),
    photosVideos: toNullableInt(data.photos_videos),
    avgComments: toNullableFloat(data.avg_comments),
    likesPerPost: toNullableFloat(data.likes_per_post),
    tagsPerPost: toNullableFloat(data.tags_per_post),
    numTagsPerPost: toNullableInt(data.num_tags_per_post),
    raw: data
  };
}

function mapFacebookSearchResult(data, context = {}) {
  const sourceUrl = data.url || data.profile_url || context.profileUrl || '';
  const username = extractFacebookUsername(sourceUrl) || sanitizeLookup(context.lookupQuery) || 'facebook-user';
  const bio = data.intro || data.about || '';
  const profilePicUrl = getProfilePictureUrl(data);

  return {
    username,
    name: data.name || username,
    bio,
    profilePicUrl,
    isVerified: Boolean(data.verified ?? data.is_verified),
    isPrivate: false,
    followerCount: toInt(data.followers ?? data.followers_count ?? data.likes, 0),
    followingCount: toInt(data.following ?? data.following_count, 0),
    postCount: toInt(data.posts_count ?? data.post_count ?? data.posts, 0),
    accountAgeDays: 365,
    bioLength: bio.length,
    hasProfilePic: !!profilePicUrl,
    platform: 'facebook',
    isPage: context.isPage ?? data.type === 'page',
    communityCount: Array.isArray(data.categories)
      ? data.categories.length
      : toNullableInt(data.community_count),
    urlsShared: toNullableInt(data.urls_shared),
    photosVideos: toNullableInt(data.photos_videos),
    avgComments: toNullableFloat(data.avg_comments),
    likesPerPost: toNullableFloat(data.likes_per_post),
    tagsPerPost: toNullableFloat(data.tags_per_post),
    numTagsPerPost: toNullableInt(data.num_tags_per_post),
    raw: data
  };
}

function pickBestFacebookResult(results, lookupQuery, profileUrl) {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const expectedUrl = normalizeComparableUrl(profileUrl);
  const normalizedQuery = sanitizeLookup(lookupQuery).toLowerCase();

  if (expectedUrl) {
    const exactUrlMatch = results.find((item) => {
      const itemUrl = normalizeComparableUrl(item.url || item.profile_url);
      return itemUrl && itemUrl === expectedUrl;
    });
    if (exactUrlMatch) return exactUrlMatch;
  }

  if (normalizedQuery) {
    const exactHandleMatch = results.find((item) => {
      const handle = extractFacebookUsername(item.url || item.profile_url).toLowerCase();
      return handle === normalizedQuery;
    });
    if (exactHandleMatch) return exactHandleMatch;

    const urlContainsMatch = results.find((item) => {
      const itemUrl = normalizeComparableUrl(item.url || item.profile_url);
      return itemUrl.includes(normalizedQuery);
    });
    if (urlContainsMatch) return urlContainsMatch;

    const nameContainsMatch = results.find((item) =>
      (item.name || '').toLowerCase().includes(normalizedQuery)
    );
    if (nameContainsMatch) return nameContainsMatch;
  }

  return results[0];
}

function extractGraphIdentifier(identifierOrUrl) {
  if (!identifierOrUrl) return '';

  const profileUrl = normalizeFacebookProfileUrl(identifierOrUrl);
  try {
    const parsed = new URL(profileUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (!segments.length) return '';

    const first = segments[0].toLowerCase();
    if (first === 'profile.php') {
      return parsed.searchParams.get('id') || '';
    }
    if (first === 'people') {
      // Graph API cannot resolve /people/... URLs without IDs/tokens.
      return '';
    }

    return decodeURIComponent(segments[0]).replace(/^@/, '').trim();
  } catch {
    return sanitizeLookup(identifierOrUrl);
  }
}

function extractLookupQuery(identifierOrUrl) {
  if (!identifierOrUrl) return '';

  const profileUrl = normalizeFacebookProfileUrl(identifierOrUrl);
  try {
    const parsed = new URL(profileUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (!segments.length) {
      return '';
    }

    const first = segments[0].toLowerCase();
    if (first === 'profile.php') {
      return parsed.searchParams.get('id') || '';
    }
    if (first === 'people') {
      const peopleName = decodeURIComponent(segments[1] || '').replace(/-/g, ' ').trim();
      return peopleName || '';
    }

    return decodeURIComponent(segments[0]).replace(/^@/, '').trim();
  } catch {
    return sanitizeLookup(identifierOrUrl);
  }
}

function extractFacebookUsername(profileUrl) {
  if (!profileUrl) return '';

  try {
    const parsed = new URL(normalizeFacebookProfileUrl(profileUrl));
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (!segments.length) return '';

    const first = segments[0].toLowerCase();
    if (first === 'profile.php') {
      return parsed.searchParams.get('id') || '';
    }
    if (first === 'people') {
      const peopleName = decodeURIComponent(segments[1] || '').trim();
      return peopleName ? peopleName.replace(/\s+/g, '-') : '';
    }

    return decodeURIComponent(segments[0]).replace(/^@/, '').trim();
  } catch {
    return sanitizeLookup(profileUrl);
  }
}

function normalizeFacebookProfileUrl(identifierOrUrl) {
  const raw = (identifierOrUrl || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    return normalizeUrlForRequest(raw);
  }
  if (/^www\.facebook\.com\//i.test(raw)) {
    return normalizeUrlForRequest(`https://${raw}`);
  }
  if (/^facebook\.com\//i.test(raw)) {
    return normalizeUrlForRequest(`https://www.${raw}`);
  }

  const cleaned = raw.replace(/^@/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  return normalizeUrlForRequest(`https://www.facebook.com/${cleaned}`);
}

function normalizeUrlForRequest(value) {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.origin}${path}${parsed.search}`;
  } catch {
    return value;
  }
}

function normalizeComparableUrl(value) {
  return normalizeUrlForRequest(value || '').toLowerCase();
}

function sanitizeLookup(value) {
  return String(value || '')
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
    .split(/[/?#]/)[0];
}

function getProfilePictureUrl(data) {
  return data.image?.uri
    || data.profile_picture?.uri
    || data.image
    || data.profile_picture
    || data.picture?.uri
    || data.picture
    || null;
}

function toInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function toNullableInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function toNullableFloat(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Get Facebook profile with user authentication
 * Requires user to have logged in via Facebook OAuth
 */
exports.getFacebookProfileWithAuth = async (userAccessToken) => {
  try {
    const response = await axios.get(
      `${FACEBOOK_GRAPH_API}/me`,
      {
        params: {
          fields: 'id,name,email,picture,friends',
          access_token: userAccessToken
        }
      }
    );

    const data = response.data;

    return {
      userId: data.id,
      name: data.name,
      email: data.email,
      profilePicUrl: data.picture?.data?.url,
      friendCount: data.friends?.summary?.total_count || 0,
      platform: 'facebook'
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid or expired Facebook access token');
    }
    throw error;
  }
};
