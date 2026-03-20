const axios = require('axios');

const INSTAGRAM_GRAPH_API = 'https://graph.instagram.com';

/**
 * Fetch Instagram profile using RapidAPI services
 * @param {string} username - Instagram username
 * @returns {Promise<object>} Profile data
 */
exports.getInstagramProfile = async (username) => {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    throw new Error('RAPIDAPI_KEY not configured in environment');
  }

  // Try multiple RapidAPI Instagram scrapers as fallbacks
  const scrapers = [
    { name: 'instagram-scraper-2025', fn: getInstagramViaScraper2025 },
    { name: 'instagram-scraper-2022', fn: getInstagramViaScraper2022 },
    { name: 'instagram-bulk-scraper', fn: getInstagramViaBulkScraper },
    { name: 'instagram-scraper-api2', fn: getInstagramViaScraperAPI2 },
  ];

  let lastError = null;

  for (const scraper of scrapers) {
    try {
      console.log(`Trying ${scraper.name}...`);
      const result = await scraper.fn(username, rapidApiKey);
      console.log(`${scraper.name} succeeded`);
      return result;
    } catch (error) {
      console.log(`${scraper.name} failed: ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`All Instagram scrapers failed. Last error: ${lastError?.message}. Make sure you're subscribed to an Instagram scraper API on RapidAPI.`);
};

/**
 * Instagram Scraper 2025 API (User's subscribed API)
 * Subscribe at: https://rapidapi.com/api/instagram-scraper-20251
 */
async function getInstagramViaScraper2025(username, apiKey) {
  const response = await axios.get(
    'https://instagram-scraper-20251.p.rapidapi.com/userinfo/',
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-scraper-20251.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      params: {
        username_or_id: username
      }
    }
  );

  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Instagram user not found');
  }

  return {
    username: data.username || username,
    name: data.full_name || data.username || username,
    bio: data.biography || data.bio || '',
    profilePicUrl: data.profile_pic_url_hd || data.profile_pic_url || data.hd_profile_pic_url_info?.url,
    isVerified: data.is_verified || false,
    isPrivate: data.is_private || false,
    followerCount: data.follower_count || data.followers_count || data.edge_followed_by?.count || 0,
    followingCount: data.following_count || data.followings_count || data.edge_follow?.count || 0,
    postCount: data.media_count || data.posts_count || data.edge_owner_to_timeline_media?.count || 0,
    accountAgeDays: 365,
    bioLength: (data.biography || data.bio || '').length,
    hasProfilePic: !!(data.profile_pic_url || data.profile_pic_url_hd),
    hasExternalUrl: !!(data.external_url || data.bio_links?.length),
    platform: 'instagram',
    raw: data
  };
}

/**
 * Instagram Scraper 2022 API (commonly available)
 * Subscribe at: https://rapidapi.com/arraybobo/api/instagram-scraper-2022
 */
async function getInstagramViaScraper2022(username, apiKey) {
  const response = await axios.get(
    'https://instagram-scraper-2022.p.rapidapi.com/ig/info_username/',
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-scraper-2022.p.rapidapi.com'
      },
      params: {
        user: username
      }
    }
  );

  const user = response.data.user;
  if (!user) {
    throw new Error('Instagram user not found');
  }

  return mapInstagramData(user);
}

/**
 * Instagram Bulk Scraper API
 * Subscribe at: https://rapidapi.com/social-starter/api/instagram-bulk-scraper-latest
 */
async function getInstagramViaBulkScraper(username, apiKey) {
  const response = await axios.get(
    'https://instagram-bulk-scraper-latest.p.rapidapi.com/webget_user_info/',
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-bulk-scraper-latest.p.rapidapi.com'
      },
      params: {
        username: username
      }
    }
  );

  const data = response.data.data?.user || response.data.user;
  if (!data) {
    throw new Error('Instagram user not found');
  }

  return mapInstagramData(data);
}

/**
 * Instagram Scraper API2
 * Subscribe at: https://rapidapi.com/social-starter/api/instagram-scraper-api2
 */
async function getInstagramViaScraperAPI2(username, apiKey) {
  const response = await axios.get(
    'https://instagram-scraper-api2.p.rapidapi.com/v1/info',
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com'
      },
      params: {
        username_or_id_or_url: username
      }
    }
  );

  const data = response.data.data;
  if (!data) {
    throw new Error('Instagram user not found');
  }

  return {
    username: data.username,
    name: data.full_name || data.username,
    bio: data.biography || '',
    profilePicUrl: data.profile_pic_url_hd || data.profile_pic_url,
    isVerified: data.is_verified || false,
    isPrivate: data.is_private || false,
    followerCount: data.follower_count || 0,
    followingCount: data.following_count || 0,
    postCount: data.media_count || 0,
    accountAgeDays: 365,
    bioLength: (data.biography || '').length,
    hasProfilePic: !!data.profile_pic_url && !data.profile_pic_url.includes('default'),
    hasExternalUrl: !!data.external_url,
    platform: 'instagram',
    raw: data
  };
}

/**
 * Map Instagram API response to standardized format
 */
function mapInstagramData(user) {
  return {
    username: user.username,
    name: user.full_name || user.username,
    bio: user.biography || user.bio || '',
    profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || user.hd_profile_pic_url_info?.url,
    isVerified: user.is_verified || false,
    isPrivate: user.is_private || false,
    followerCount: user.follower_count || user.edge_followed_by?.count || 0,
    followingCount: user.following_count || user.edge_follow?.count || 0,
    postCount: user.media_count || user.edge_owner_to_timeline_media?.count || 0,
    accountAgeDays: 365, // Not available from most APIs
    bioLength: (user.biography || user.bio || '').length,
    hasProfilePic: !!(user.profile_pic_url || user.profile_pic_url_hd),
    hasExternalUrl: !!(user.external_url || user.bio_links?.length),
    platform: 'instagram',
    raw: user
  };
}
