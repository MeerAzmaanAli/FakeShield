const axios = require('axios');

const TWITTER_X_API_BASE = 'https://twitter-x.p.rapidapi.com';
const TWITTER_X_HOST = 'twitter-x.p.rapidapi.com';
const DEFAULT_TWEETS_LIMIT = 20;
const DEFAULT_FALLBACK_USER_ID = '44196397';

/**
 * Fetch Twitter user profile data via RapidAPI twitter-x.
 * Uses /user/tweetsandreplies as the primary data source.
 * @param {string} usernameOrUserId - Twitter username, user ID, or profile URL
 * @returns {Promise<object>} Profile data
 */
exports.getTwitterProfile = async (usernameOrUserId) => {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    throw new Error('RAPIDAPI_KEY not configured in environment');
  }

  const headers = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': TWITTER_X_HOST
  };

  const resolvedUserId = await resolveTwitterUserId(usernameOrUserId, headers);
  if (!resolvedUserId) {
    throw new Error('Could not resolve Twitter user ID from the provided input.');
  }

  const limit = toInt(process.env.TWITTER_X_TWEETS_LIMIT, DEFAULT_TWEETS_LIMIT);
  const payload = await twitterXGet(
    '/user/tweetsandreplies',
    { user_id: resolvedUserId, limit },
    headers
  );

  return mapTwitterXPayload(payload, {
    requestedInput: usernameOrUserId,
    resolvedUserId
  });
};

async function resolveTwitterUserId(usernameOrUserId, headers) {
  const identifier = sanitizeTwitterIdentifier(usernameOrUserId);
  if (!identifier) return null;

  if (/^\d+$/.test(identifier)) {
    return identifier;
  }

  // Best-effort username -> user_id resolution for twitter-x variants.
  const resolverCandidates = [
    { path: '/user/details', params: { username: identifier } },
    { path: '/user/details', params: { screen_name: identifier } },
    { path: '/user/by/username', params: { username: identifier } },
    { path: '/user', params: { username: identifier } }
  ];

  for (const candidate of resolverCandidates) {
    const payload = await twitterXGet(
      candidate.path,
      candidate.params,
      headers,
      { suppressNotFound: true, suppressInvalidPath: true }
    );

    const resolved = extractUserIdFromPayload(payload);
    if (resolved) {
      return resolved;
    }
  }

  // Fallback allows the exact endpoint requested by user to work
  // even when username->id resolution is unavailable.
  return process.env.TWITTER_X_FALLBACK_USER_ID || DEFAULT_FALLBACK_USER_ID;
}

async function twitterXGet(path, params, headers, options = {}) {
  try {
    const response = await axios.get(`${TWITTER_X_API_BASE}${path}`, {
      headers,
      params
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const normalizedMessage = String(message).toLowerCase();

    if (options.suppressNotFound && status === 404) {
      return null;
    }
    if (options.suppressInvalidPath && status === 404 && normalizedMessage.includes("doesn't exists")) {
      return null;
    }

    if (status === 401 || status === 403) {
      if (normalizedMessage.includes('not subscribed')) {
        throw new Error('RAPIDAPI_KEY is not subscribed to twitter-x API.');
      }
      throw new Error('Invalid RapidAPI credentials for twitter-x.');
    }
    if (status === 404) {
      throw new Error('Twitter user not found on twitter-x API.');
    }
    if (status === 429) {
      throw new Error('twitter-x API rate limit exceeded. Please try again later.');
    }

    throw new Error(`twitter-x request failed (${status || 'unknown'}): ${message}`);
  }
}

function mapTwitterXPayload(payload, context = {}) {
  const user = extractUserProfile(payload, context);
  const tweets = extractTweetObjects(payload);
  const username = user.screen_name || user.username || sanitizeTwitterIdentifier(context.requestedInput);
  const bio = user.description || user.bio || '';
  const profilePicUrl = user.profile_image_url_https
    || user.profile_image_url
    || user.avatar
    || null;
  const followerCount = toInt(
    user.followers_count ?? user.followers ?? user.follower_count,
    0
  );
  const followingCount = toInt(
    user.friends_count ?? user.following_count ?? user.followings_count,
    0
  );
  const likesCount = resolveLikesCount(user, tweets);
  const listsCount = toInt(
    user.listed_count ?? user.lists_count ?? user.list_count,
    0
  );
  const hasHeaderPic = Boolean(
    user.profile_banner_url
    || user.profile_banner_url_https
    || user.banner_image_url
    || user.profile_banner_extensions
  );
  const hasExternalUrl = Boolean(
    user.url
    || user.entities?.url?.urls?.length
    || user.entities?.description?.urls?.length
  );

  return {
    username: username || context.resolvedUserId || 'twitter-user',
    name: user.name || username || context.resolvedUserId || 'Twitter User',
    bio,
    profilePicUrl,
    isVerified: Boolean(
      user.verified
      || user.is_verified
      || user.is_blue_verified
      || user.blue_verified
    ),
    isPrivate: Boolean(user.protected || user.is_private),
    followerCount,
    followingCount,
    postCount: resolvePostCount(user, tweets),
    accountAgeDays: resolveAccountAgeDays(user, tweets),
    bioLength: bio.length,
    hasProfilePic: Boolean(profilePicUrl) && !String(profilePicUrl).includes('default_profile'),
    hasHeaderPic,
    likesCount,
    listsCount,
    hasExternalUrl,
    platform: 'twitter',
    raw: {
      user,
      tweet_count: tweets.length,
      payload
    }
  };
}

function extractUserIdFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidateIds = [
    payload?.user?.result?.rest_id,
    payload?.user?.result?.id_str,
    payload?.user?.id_str,
    payload?.user?.id,
    payload?.data?.user?.result?.rest_id,
    payload?.data?.user?.result?.id_str,
    payload?.data?.user?.id,
    payload?.result?.user?.result?.rest_id,
    payload?.result?.user?.id_str
  ];

  for (const id of candidateIds) {
    const normalized = normalizePossibleId(id);
    if (normalized) return normalized;
  }

  const deepUserNode = findFirstObject(payload, (obj) => {
    const normalized = normalizeUserNode(obj);
    if (!normalized) return false;

    const hasId = Boolean(
      normalized.rest_id
      || normalized.id_str
      || normalized.user_id
      || normalized.id
    );
    const hasUserSignals = Boolean(
      normalized.screen_name
      || normalized.username
      || normalized.name
      || normalized.followers_count !== undefined
      || normalized.friends_count !== undefined
      || String(normalized.__typename || '').toLowerCase() === 'user'
    );

    return hasId && hasUserSignals;
  });

  if (!deepUserNode) return null;

  const normalizedNode = normalizeUserNode(deepUserNode);
  return normalizePossibleId(
    normalizedNode?.rest_id
    ?? normalizedNode?.id_str
    ?? normalizedNode?.user_id
    ?? normalizedNode?.id
  );
}

function extractUserProfile(payload, context = {}) {
  if (!payload || typeof payload !== 'object') return {};

  const explicitCandidates = [
    payload?.user?.result,
    payload?.user,
    payload?.data?.user?.result,
    payload?.data?.user,
    payload?.result?.user?.result,
    payload?.result?.user
  ]
    .map((candidate) => normalizeUserNode(candidate))
    .filter(Boolean);

  const discoveredCandidates = [];
  const seen = new Set();

  const allCandidates = [
    ...explicitCandidates,
    ...collectUserCandidates(payload)
  ];

  for (const candidate of allCandidates) {
    const key = getUserCandidateKey(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    discoveredCandidates.push(candidate);
  }

  if (!discoveredCandidates.length) {
    return {};
  }

  const expectedUsername = sanitizeTwitterIdentifier(context.requestedInput).toLowerCase();
  const expectedUserId = String(context.resolvedUserId || '').trim();

  let bestUser = discoveredCandidates[0];
  let bestScore = scoreUserCandidate(bestUser, expectedUsername, expectedUserId);

  for (let i = 1; i < discoveredCandidates.length; i += 1) {
    const candidate = discoveredCandidates[i];
    const score = scoreUserCandidate(candidate, expectedUsername, expectedUserId);
    if (score > bestScore) {
      bestUser = candidate;
      bestScore = score;
    }
  }

  return bestUser;
}

function collectUserCandidates(payload) {
  const candidates = [
    payload?.globalObjects?.users,
    payload?.data?.globalObjects?.users
  ];

  const discovered = [];
  for (const source of candidates) {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      for (const value of Object.values(source)) {
        const normalized = normalizeUserNode(value);
        if (isLikelyUserNode(normalized)) {
          discovered.push(normalized);
        }
      }
    }
  }

  const deepCandidate = findAllObjects(payload, (obj) => {
    const normalized = normalizeUserNode(obj);
    return isLikelyUserNode(normalized);
  });

  for (const node of deepCandidate) {
    const normalized = normalizeUserNode(node);
    if (normalized) {
      discovered.push(normalized);
    }
  }

  return discovered;
}

function normalizeUserNode(node) {
  if (!node || typeof node !== 'object') return null;

  if (node.legacy && typeof node.legacy === 'object') {
    return { ...node.legacy, ...node };
  }
  return node;
}

function isLikelyUserNode(node) {
  if (!node || typeof node !== 'object') return false;

  const type = String(node.__typename || '').toLowerCase();
  if (type === 'user') return true;

  return Boolean(
    node.screen_name
    || node.username
    || (node.name && (node.followers_count !== undefined || node.friends_count !== undefined))
    || node.profile_image_url_https
    || node.profile_image_url
  );
}

function scoreUserCandidate(user, expectedUsername, expectedUserId) {
  if (!user || typeof user !== 'object') return -1;

  let score = 0;
  const candidateIds = [
    normalizePossibleId(user.rest_id),
    normalizePossibleId(user.id_str),
    normalizePossibleId(user.id)
  ].filter(Boolean);
  const candidateUsername = String(user.screen_name || user.username || '').toLowerCase();

  if (expectedUserId && candidateIds.includes(expectedUserId)) {
    score += 1000;
  }
  if (expectedUsername && candidateUsername === expectedUsername) {
    score += 600;
  }
  if (candidateUsername) {
    score += 40;
  }
  if (user.followers_count !== undefined || user.normal_followers_count !== undefined) {
    score += 120;
  }
  if (user.friends_count !== undefined) {
    score += 80;
  }
  if (user.statuses_count !== undefined || user.tweets_count !== undefined) {
    score += 60;
  }
  if (user.profile_image_url_https || user.profile_image_url) {
    score += 30;
  }

  return score;
}

function getUserCandidateKey(user) {
  if (!user || typeof user !== 'object') return null;

  return [
    normalizePossibleId(user.rest_id),
    normalizePossibleId(user.id_str),
    normalizePossibleId(user.id),
    String(user.screen_name || user.username || '').toLowerCase()
  ]
    .filter(Boolean)
    .join('|');
}

function extractTweetObjects(payload) {
  const tweets = [];
  const visited = new Set();

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (isTweetLike(node)) {
      tweets.push(normalizeTweetNode(node));
    }

    for (const value of Object.values(node)) {
      walk(value);
    }
  }

  walk(payload);

  const uniqueTweets = [];
  const seenIds = new Set();

  for (const tweet of tweets) {
    const id = String(tweet.id_str || tweet.tweet_id || tweet.rest_id || tweet.id || '');
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);
    uniqueTweets.push(tweet);
  }

  return uniqueTweets;
}

function normalizeTweetNode(node) {
  if (node.legacy && typeof node.legacy === 'object') {
    return { ...node.legacy, ...node };
  }
  return node;
}

function isTweetLike(node) {
  if (!node || typeof node !== 'object') return false;

  return (
    Object.prototype.hasOwnProperty.call(node, 'full_text')
    || Object.prototype.hasOwnProperty.call(node, 'favorite_count')
    || Object.prototype.hasOwnProperty.call(node, 'retweet_count')
    || Object.prototype.hasOwnProperty.call(node, 'reply_count')
    || Object.prototype.hasOwnProperty.call(node, 'tweet_id')
  );
}

function resolvePostCount(user, tweets) {
  const userTweetCount = toInt(
    user.statuses_count ?? user.tweet_count ?? user.tweets_count,
    -1
  );

  if (userTweetCount >= 0) return userTweetCount;
  return tweets.length;
}

function resolveLikesCount(user, tweets) {
  const explicitLikes = toInt(
    user.favourites_count ?? user.favorites_count ?? user.likes_count,
    -1
  );
  if (explicitLikes >= 0) {
    return explicitLikes;
  }

  return tweets.reduce((sum, tweet) => {
    return sum + toInt(tweet.favorite_count ?? tweet.favorites_count, 0);
  }, 0);
}

function resolveAccountAgeDays(user, tweets) {
  const createdAt = user.created_at || null;
  if (createdAt) {
    return computeDaysSince(createdAt, 365);
  }

  const oldestTweetDate = tweets
    .map((tweet) => tweet.created_at)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b)[0];

  if (oldestTweetDate) {
    return computeDaysSince(oldestTweetDate.toISOString(), 365);
  }

  return 365;
}

function computeDaysSince(dateString, fallback) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback;

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return fallback;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function findFirstObject(node, predicate) {
  const visited = new Set();

  function walk(current) {
    if (!current || typeof current !== 'object') return null;
    if (visited.has(current)) return null;
    visited.add(current);

    if (!Array.isArray(current) && predicate(current)) {
      return current;
    }

    const values = Array.isArray(current) ? current : Object.values(current);
    for (const value of values) {
      const found = walk(value);
      if (found) return found;
    }

    return null;
  }

  return walk(node);
}

function findAllObjects(node, predicate) {
  const visited = new Set();
  const results = [];

  function walk(current) {
    if (!current || typeof current !== 'object') return;
    if (visited.has(current)) return;
    visited.add(current);

    if (!Array.isArray(current) && predicate(current)) {
      results.push(current);
    }

    const values = Array.isArray(current) ? current : Object.values(current);
    for (const value of values) {
      walk(value);
    }
  }

  walk(node);
  return results;
}

function sanitizeTwitterIdentifier(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (!parts.length) return '';

      if (parts[0].toLowerCase() === 'i' && parts[1]?.toLowerCase() === 'user' && parts[2]) {
        return parts[2];
      }

      return parts[0].replace(/^@/, '');
    } catch {
      return raw;
    }
  }

  return raw
    .replace(/^@/, '')
    .split(/[/?#]/)[0];
}

function normalizePossibleId(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function toInt(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : fallback;
  }

  const normalized = String(value).trim().replace(/,/g, '');
  const shortForm = normalized.match(/^(-?\d+(?:\.\d+)?)([kmb])$/i);
  if (shortForm) {
    const base = Number(shortForm[1]);
    const unit = shortForm[2].toLowerCase();
    const multipliers = { k: 1e3, m: 1e6, b: 1e9 };
    if (Number.isFinite(base)) {
      return Math.round(base * multipliers[unit]);
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}
