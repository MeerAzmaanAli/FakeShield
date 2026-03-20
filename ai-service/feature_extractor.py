"""
Multi-platform feature extractor for fake account detection.
Extracts features based on the platform type.
"""

def extract_features(data: dict, platform: str = 'instagram') -> list:
    """
    Extract features from profile data based on platform.

    Args:
        data: Dictionary containing profile data
        platform: Platform type ('instagram', 'facebook', 'twitter', 'other')

    Returns:
        List of features for the model
    """
    platform = platform.lower() if platform else 'instagram'

    if platform == 'facebook':
        return extract_facebook_features(data)
    elif platform == 'twitter':
        return extract_twitter_features(data)
    else:
        # Default to Instagram features (also used for 'other')
        return extract_instagram_features(data)


def extract_instagram_features(data: dict) -> list:
    """
    Extract features for Instagram fake detection model.
    Features match the training data columns:
    - profile pic, nums/length username, fullname words, nums/length fullname,
    - name==username, description length, external URL, private,
    - #posts, #followers, #follows
    """
    return [
        int(data.get('has_profile_pic', 0)),         # index 0
        float(data.get('nums_length_username', 0)),  # index 1
        int(data.get('fullname_words', 0)),          # index 2
        float(data.get('nums_length_fullname', 0)),  # index 3
        int(data.get('name_equals_username', 0)),    # index 4
        int(data.get('bio_length', 0)),              # index 5
        int(data.get('has_external_url', 0)),        # index 6
        int(data.get('is_private', 0)),              # index 7
        int(data.get('post_count', 0)),              # index 8
        int(data.get('follower_count', 0)),          # index 9
        int(data.get('following_count', 0)),         # index 10
    ]


def extract_facebook_features(data: dict) -> list:
    """
    Extract features for Facebook fake detection model.
    Features match the Facebook Spam Dataset columns:
    - friends_count, following_count, community_count, account_age,
    - posts_shared, urls_shared, photos_videos, url_post_ratio,
    - media_post_ratio, avg_comments, likes_per_post, tags_per_post, num_tags_per_post
    """
    # Map common field names to Facebook-specific features
    follower_count = int(data.get('follower_count', data.get('friends_count', 0)))
    following_count = int(data.get('following_count', 0))
    post_count = int(data.get('post_count', data.get('posts_shared', 0)))

    # Calculate derived features with sensible defaults
    url_post_ratio = float(data.get('url_post_ratio', 0.2))
    media_post_ratio = float(data.get('media_post_ratio', 0.5))

    return [
        follower_count,                                              # friends_count
        following_count,                                             # following_count
        int(data.get('community_count', 50)),                       # community_count
        int(data.get('account_age', data.get('account_age_days', 365))),  # account_age
        post_count,                                                  # posts_shared
        int(data.get('urls_shared', post_count * 0.3)),             # urls_shared
        int(data.get('photos_videos', post_count * 0.7)),           # photos_videos
        url_post_ratio,                                              # url_post_ratio
        media_post_ratio,                                            # media_post_ratio
        float(data.get('avg_comments', 0.5)),                       # avg_comments
        float(data.get('likes_per_post', 1.5)),                     # likes_per_post
        float(data.get('tags_per_post', 20)),                       # tags_per_post
        int(data.get('num_tags_per_post', 10)),                     # num_tags_per_post
    ]


def extract_twitter_features(data: dict) -> list:
    """
    Extract features for Twitter fake detection model.
    Features based on Twitter-specific signals:
    - has_profile_pic, has_header_pic, bio_length, account_age_days,
    - follower_count, following_count, tweet_count, retweet_ratio,
    - likes_count, lists_count, is_verified, is_default_profile, has_url, avg_tweets_per_day
    """
    follower_count = int(data.get('follower_count', 0))
    following_count = int(data.get('following_count', 0))
    post_count = int(data.get('post_count', data.get('tweet_count', 0)))
    account_age = int(data.get('account_age_days', data.get('account_age', 365)))

    # Calculate derived features
    avg_tweets_per_day = post_count / max(account_age, 1)
    retweet_ratio = float(data.get('retweet_ratio', 0.3))

    return [
        int(data.get('has_profile_pic', 1)),                        # has_profile_pic
        int(data.get('has_header_pic', 1)),                         # has_header_pic
        int(data.get('bio_length', 0)),                             # bio_length
        account_age,                                                 # account_age_days
        follower_count,                                              # follower_count
        following_count,                                             # following_count
        post_count,                                                  # tweet_count
        retweet_ratio,                                               # retweet_ratio
        int(data.get('likes_count', 100)),                          # likes_count
        int(data.get('lists_count', 1)),                            # lists_count
        int(data.get('is_verified', 0)),                            # is_verified
        int(data.get('is_default_profile', 0)),                     # is_default_profile
        int(data.get('has_external_url', data.get('has_url', 0))),  # has_url
        float(avg_tweets_per_day),                                   # avg_tweets_per_day
    ]
