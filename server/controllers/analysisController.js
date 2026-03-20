const { getAIPrediction } = require("../services/aiService.js");
const { getTwitterProfile } = require("../services/twitterService.js");
const { getInstagramProfile } = require("../services/instagramService.js");
const { getFacebookProfile } = require("../services/facebookService.js");

exports.analyzeProfile = async (req, res) => {
  try {
    // Accept data directly from body (frontend sends without wrapper)
    const data = req.body;

    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    // Get platform (default to instagram)
    const platform = (data.platform || 'instagram').toLowerCase();

    // Transform camelCase frontend data to snake_case for AI service
    // Also calculate derived features from the provided data
    const username = extractUsername(data.profileURL);
    const numsInUsername = (username.match(/[0-9]/g) || []).length;
    const numsLengthUsername = username.length > 0
      ? parseFloat((numsInUsername / username.length).toFixed(2))
      : 0;

    // Build profile data with platform-specific fields
    const profileData = {
      platform: platform,
      has_profile_pic: data.hasProfilePic ? 1 : 0,
      nums_length_username: numsLengthUsername,
      fullname_words: 2, // default assumption
      nums_length_fullname: 0, // default
      name_equals_username: 0, // default
      bio_length: parseInt(data.bioLength) || 0,
      has_external_url: data.hasExternalUrl ? 1 : 0,
      is_private: data.isPrivate ? 1 : 0,
      post_count: parseInt(data.postCount) || 0,
      follower_count: parseInt(data.followerCount) || 0,
      following_count: parseInt(data.followingCount) || 0,
      // Additional fields for Facebook/Twitter models
      account_age_days: parseInt(data.accountAgeDays) || 365,
      is_verified: data.isVerified ? 1 : 0,
    };

    // Add Facebook-specific fields
    if (platform === 'facebook') {
      profileData.community_count = parseInt(data.communityCount) || 50;
      profileData.urls_shared = parseInt(data.urlsShared) || 0;
      profileData.photos_videos = parseInt(data.photosVideos) || 0;
      profileData.avg_comments = parseFloat(data.avgComments) || 0.5;
      profileData.likes_per_post = parseFloat(data.likesPerPost) || 1.5;
    }

    // Add Twitter-specific fields
    if (platform === 'twitter') {
      profileData.has_header_pic = data.hasHeaderPic ? 1 : 0;
      profileData.likes_count = parseInt(data.likesCount) || 0;
      profileData.lists_count = parseInt(data.listsCount) || 0;
    }

    const response = await getAIPrediction(profileData);

    res.json({
      score: response.data.score,
      verdict: response.data.verdict,
      platform: response.data.platform || platform,
    });
  } catch (error) {
    console.error("Error analyzing profile:", error.message);
    res.status(500).json({ error: "Failed to analyze profile" });
  }
};

// Helper function to extract username from URL
function extractUsername(profileURL) {
  if (!profileURL) return "";
  try {
    const url = new URL(profileURL);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    // If not a valid URL, treat the whole thing as username
    return profileURL.replace(/[^a-zA-Z0-9._]/g, "");
  }
}

exports.scrapeProfileData = async (req, res) => {
  const { profileURL, platform } = req.body;

  // ── Step 1: Validate inputs ──────────────────────────────────────────
  if (!profileURL || !platform) {
    return res.status(400).json({
      success: false,
      message: "profileURL and platform are required",
    });
  }

  const validPlatforms = ["instagram", "facebook", "twitter", "other"];
  if (!validPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
    });
  }

  // ── Step 2: Extract username from URL ───────────────────────────────
  let username = "";

  try {
    const url = new URL(profileURL);
    const parts = url.pathname.split("/").filter(Boolean);
    username = parts[0] || "";
  } catch (error) {
    // If not a valid URL, treat as username directly
    username = profileURL.replace(/[^a-zA-Z0-9._]/g, "");
  }

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Could not extract username from URL",
    });
  }

  // ── Step 3: Fetch real profile data from platform API ────────────────
  try {
    let profileData;
    const platformLower = platform.toLowerCase();

    switch (platformLower) {
      case "twitter":
        // Pass full URL/input so twitter service can resolve either username or user_id URLs.
        profileData = await getTwitterProfile(profileURL);
        break;
      case "instagram":
        profileData = await getInstagramProfile(username);
        break;
      case "facebook":
        // Use the full URL for Facebook so the scraper can resolve
        // both page URLs and /people/... profile URLs.
        profileData = await getFacebookProfile(profileURL);
        break;
      case "other":
        // For 'other' platforms, return empty data for manual entry
        return res.status(200).json({
          success: true,
          message: "Please enter profile data manually for this platform",
          data: {
            username,
            platform,
            profileURL,
            profileData: {
              follower_count: 0,
              following_count: 0,
              post_count: 0,
              bio_length: 0,
              has_profile_pic: 0,
            },
            requiresManualEntry: true,
          },
        });
      default:
        throw new Error("Unsupported platform");
    }

    // ── Step 4: Return scraped data ──────────────────────────────────────
    const scrapedProfileData = {
      follower_count: profileData.followerCount,
      following_count: profileData.followingCount,
      post_count: profileData.postCount,
      bio_length: profileData.bioLength,
      has_profile_pic: profileData.hasProfilePic ? 1 : 0,
      is_verified: profileData.isVerified ? 1 : 0,
      is_private: profileData.isPrivate ? 1 : 0,
      account_age_days: profileData.accountAgeDays,
      name: profileData.name,
      bio: profileData.bio,
      profile_pic_url: profileData.profilePicUrl,
    };

    if (platformLower === "facebook") {
      scrapedProfileData.community_count = profileData.communityCount ?? null;
      scrapedProfileData.urls_shared = profileData.urlsShared ?? null;
      scrapedProfileData.photos_videos = profileData.photosVideos ?? null;
      scrapedProfileData.avg_comments = profileData.avgComments ?? null;
      scrapedProfileData.likes_per_post = profileData.likesPerPost ?? null;
      scrapedProfileData.tags_per_post = profileData.tagsPerPost ?? null;
      scrapedProfileData.num_tags_per_post = profileData.numTagsPerPost ?? null;
    }

    if (platformLower === "twitter") {
      scrapedProfileData.has_header_pic = profileData.hasHeaderPic ? 1 : 0;
      scrapedProfileData.likes_count = profileData.likesCount ?? null;
      scrapedProfileData.lists_count = profileData.listsCount ?? null;
      scrapedProfileData.has_external_url = profileData.hasExternalUrl ? 1 : 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        username: profileData.username,
        platform,
        profileURL,
        profileData: scrapedProfileData,
      },
    });
  } catch (error) {
    console.error(`Error scraping ${platform} profile:`, error.message);

    // Return helpful error message with fallback option
    return res.status(400).json({
      success: false,
      message: error.message || `Failed to fetch ${platform} profile data`,
      hint: "Please check API configuration or enter data manually",
      requiresManualEntry: true,
    });
  }
};
