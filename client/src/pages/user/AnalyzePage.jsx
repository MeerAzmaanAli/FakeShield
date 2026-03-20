import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function AnalyzePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const profileURL = watch('profileURL');

  // Reset form when platform changes
  useEffect(() => {
    setScraped(false);
    reset({ profileURL: profileURL || '' });
  }, [selectedPlatform]);

  const scrapeProfile = async () => {
    if (!profileURL) {
      setError('Please enter a profile URL first');
      return;
    }

    try {
      setScraping(true);
      setError('');
      setScraped(false);

      const response = await api.post('/analysis/scrape', {
        profileURL,
        platform: selectedPlatform
      });

      if (response.data.success) {
        const data = response.data.data.profileData;

        // Common fields
        setValue('followerCount', data.follower_count || 0);
        setValue('followingCount', data.following_count || 0);
        setValue('postCount', data.post_count || 0);
        setValue('bioLength', data.bio_length || 0);
        setValue('hasProfilePic', data.has_profile_pic === 1);
        setValue('isVerified', data.is_verified === 1);
        setValue('accountAgeDays', data.account_age_days || 365);

        // Platform-specific fields
        if (selectedPlatform === 'facebook') {
          const scrapedPostCount = Number(data.post_count || 0);
          setValue('friendsCount', data.follower_count || 0);
          setValue('postsShared', scrapedPostCount);
          setValue('communityCount', data.community_count ?? 50);
          setValue('urlsShared', data.urls_shared ?? Math.round(scrapedPostCount * 0.3));
          setValue('photosVideos', data.photos_videos ?? Math.round(scrapedPostCount * 0.7));
          setValue('avgComments', data.avg_comments ?? 0.5);
          setValue('likesPerPost', data.likes_per_post ?? 1.5);
        }

        if (selectedPlatform === 'twitter') {
          setValue('tweetCount', data.post_count || 0);
          setValue('likesCount', data.likes_count ?? 0);
          setValue('listsCount', data.lists_count ?? 0);
          setValue('hasHeaderPic', data.has_header_pic === 1);
        }

        setScraped(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scrape profile. Please enter data manually.');
    } finally {
      setScraping(false);
    }
  };

  const onAnalyze = async (data) => {
    try {
      setLoading(true);
      setError('');

      // Build platform-specific profile data
      let profileData = {
        platform: selectedPlatform,
        profileURL: data.profileURL,
      };

      if (selectedPlatform === 'instagram') {
        profileData = {
          ...profileData,
          followerCount: parseInt(data.followerCount) || 0,
          followingCount: parseInt(data.followingCount) || 0,
          postCount: parseInt(data.postCount) || 0,
          accountAgeDays: parseInt(data.accountAgeDays) || 0,
          hasProfilePic: data.hasProfilePic || false,
          bioLength: parseInt(data.bioLength) || 0,
          isVerified: data.isVerified || false,
          isPrivate: data.isPrivate || false,
        };
      } else if (selectedPlatform === 'facebook') {
        profileData = {
          ...profileData,
          followerCount: parseInt(data.friendsCount) || 0,
          followingCount: parseInt(data.followingCount) || 0,
          postCount: parseInt(data.postsShared) || 0,
          accountAgeDays: parseInt(data.accountAgeDays) || 0,
          communityCount: parseInt(data.communityCount) || 0,
          urlsShared: parseInt(data.urlsShared) || 0,
          photosVideos: parseInt(data.photosVideos) || 0,
          avgComments: parseFloat(data.avgComments) || 0.5,
          likesPerPost: parseFloat(data.likesPerPost) || 1.5,
        };
      } else if (selectedPlatform === 'twitter') {
        profileData = {
          ...profileData,
          followerCount: parseInt(data.followerCount) || 0,
          followingCount: parseInt(data.followingCount) || 0,
          postCount: parseInt(data.tweetCount) || 0,
          accountAgeDays: parseInt(data.accountAgeDays) || 0,
          hasProfilePic: data.hasProfilePic || false,
          hasHeaderPic: data.hasHeaderPic || false,
          bioLength: parseInt(data.bioLength) || 0,
          isVerified: data.isVerified || false,
          likesCount: parseInt(data.likesCount) || 0,
          listsCount: parseInt(data.listsCount) || 0,
        };
      } else {
        // Other platform - generic fields
        profileData = {
          ...profileData,
          followerCount: parseInt(data.followerCount) || 0,
          followingCount: parseInt(data.followingCount) || 0,
          postCount: parseInt(data.postCount) || 0,
          accountAgeDays: parseInt(data.accountAgeDays) || 0,
          hasProfilePic: data.hasProfilePic || false,
          bioLength: parseInt(data.bioLength) || 0,
          isVerified: data.isVerified || false,
        };
      }

      const response = await api.post('/analysis/predict', profileData);
      setResult(response.data);
      setFormData({ ...profileData, ...data });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      setError('');

      await api.post('/reports', {
        platform: formData.platform,
        profileURL: formData.profileURL,
        profileData: formData,
        aiScore: result.score,
        aiVerdict: result.verdict
      });

      navigate('/my-reports');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const startNewAnalysis = () => {
    setStep(1);
    setResult(null);
    setFormData(null);
    setScraped(false);
    reset();
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'fake' || verdict === 'probably fake') return 'fake';
    if (verdict === 'suspicious') return 'suspicious';
    return 'safe';
  };

  const getVerdictLabel = (verdict) => {
    switch (verdict) {
      case 'fake': return '⚠️ LIKELY FAKE';
      case 'probably fake': return '⚠️ PROBABLY FAKE';
      case 'suspicious': return '⚡ SUSPICIOUS';
      case 'probably real': return '✅ PROBABLY AUTHENTIC';
      case 'real': return '✅ LIKELY AUTHENTIC';
      default: return '❓ UNKNOWN';
    }
  };

  const getVerdictMessage = (verdict) => {
    switch (verdict) {
      case 'fake': return 'This profile shows strong indicators of being a fake or bot account.';
      case 'probably fake': return 'This profile has multiple characteristics commonly found in fake accounts.';
      case 'suspicious': return 'This profile has some suspicious characteristics that warrant review.';
      case 'probably real': return 'This profile shows mostly authentic characteristics with minor concerns.';
      case 'real': return 'This profile appears to be authentic based on our analysis.';
      default: return 'Unable to determine the authenticity of this profile.';
    }
  };

  const getScoreOffset = (score) => {
    const maxOffset = 188.5;
    return maxOffset - (score / 100) * maxOffset;
  };

  const getPlaceholderURL = () => {
    switch (selectedPlatform) {
      case 'instagram': return 'https://instagram.com/username';
      case 'facebook': return 'https://facebook.com/username';
      case 'twitter': return 'https://twitter.com/username';
      default: return 'https://example.com/profile';
    }
  };

  // Platform-specific form fields
  const renderInstagramFields = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Followers</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followerCount', { required: 'Required', min: 0 })}
          />
          {errors.followerCount && <span className="form-error">{errors.followerCount.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Following</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followingCount', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Posts</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('postCount', { required: 'Required', min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Age (days)</label>
          <input
            type="number"
            className="form-input"
            placeholder="365"
            {...register('accountAgeDays', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bio Length (characters)</label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          {...register('bioLength', { min: 0 })}
        />
      </div>

      <div className="form-row">
        <label className="form-checkbox">
          <input type="checkbox" {...register('hasProfilePic')} />
          <span>Has Profile Picture</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" {...register('isVerified')} />
          <span>Verified Account</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" {...register('isPrivate')} />
          <span>Private Account</span>
        </label>
      </div>
    </>
  );

  const renderFacebookFields = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Friends Count</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('friendsCount', { required: 'Required', min: 0 })}
          />
          {errors.friendsCount && <span className="form-error">{errors.friendsCount.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Following</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followingCount', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Community Groups</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('communityCount', { min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Age (days)</label>
          <input
            type="number"
            className="form-input"
            placeholder="365"
            {...register('accountAgeDays', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Posts Shared</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('postsShared', { required: 'Required', min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">URLs Shared</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('urlsShared', { min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Photos/Videos Posted</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('photosVideos', { min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Avg Comments/Post</label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            placeholder="0.5"
            {...register('avgComments', { min: 0 })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Avg Likes/Post</label>
        <input
          type="number"
          step="0.1"
          className="form-input"
          placeholder="1.5"
          {...register('likesPerPost', { min: 0 })}
        />
      </div>
    </>
  );

  const renderTwitterFields = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Followers</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followerCount', { required: 'Required', min: 0 })}
          />
          {errors.followerCount && <span className="form-error">{errors.followerCount.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Following</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followingCount', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tweets</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('tweetCount', { required: 'Required', min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Age (days)</label>
          <input
            type="number"
            className="form-input"
            placeholder="365"
            {...register('accountAgeDays', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Likes Given</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('likesCount', { min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Lists Memberships</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('listsCount', { min: 0 })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bio Length (characters)</label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          {...register('bioLength', { min: 0 })}
        />
      </div>

      <div className="form-row">
        <label className="form-checkbox">
          <input type="checkbox" {...register('hasProfilePic')} />
          <span>Has Profile Picture</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" {...register('hasHeaderPic')} />
          <span>Has Header Image</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" {...register('isVerified')} />
          <span>Verified Account</span>
        </label>
      </div>
    </>
  );

  const renderOtherFields = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Followers/Friends</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followerCount', { required: 'Required', min: 0 })}
          />
          {errors.followerCount && <span className="form-error">{errors.followerCount.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Following</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('followingCount', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Posts/Content</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            {...register('postCount', { required: 'Required', min: 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Age (days)</label>
          <input
            type="number"
            className="form-input"
            placeholder="365"
            {...register('accountAgeDays', { required: 'Required', min: 0 })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bio Length (characters)</label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          {...register('bioLength', { min: 0 })}
        />
      </div>

      <div className="form-row">
        <label className="form-checkbox">
          <input type="checkbox" {...register('hasProfilePic')} />
          <span>Has Profile Picture</span>
        </label>
        <label className="form-checkbox">
          <input type="checkbox" {...register('isVerified')} />
          <span>Verified Account</span>
        </label>
      </div>
    </>
  );

  const renderPlatformFields = () => {
    switch (selectedPlatform) {
      case 'instagram': return renderInstagramFields();
      case 'facebook': return renderFacebookFields();
      case 'twitter': return renderTwitterFields();
      default: return renderOtherFields();
    }
  };

  return (
    <Layout title="Profile Analyzer" subtitle="AI-Powered Detection">
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {scraped && (
        <div className="alert-banner success">
          <div className="alert-icon">✅</div>
          <div className="alert-text">
            <strong>Profile data scraped successfully!</strong> Review the autofilled data and click Analyze.
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          {/* Platform Selection */}
          <div className="scan-panel">
            <div className="platform-tabs">
              <button
                type="button"
                className={`tab ${selectedPlatform === 'instagram' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('instagram')}
              >
                📷 Instagram
              </button>
              <button
                type="button"
                className={`tab ${selectedPlatform === 'facebook' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('facebook')}
              >
                𝑓 Facebook
              </button>
              <button
                type="button"
                className={`tab ${selectedPlatform === 'twitter' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('twitter')}
              >
                𝕏 Twitter
              </button>
              <button
                type="button"
                className={`tab ${selectedPlatform === 'other' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('other')}
              >
                🌐 Other
              </button>
            </div>
          </div>

          {/* Analysis Form */}
          <form onSubmit={handleSubmit(onAnalyze)}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  🔍 {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Profile Information
                </div>
                <div className="panel-count">Enter URL to auto-scrape or fill manually</div>
              </div>
              <div className="panel-body padded">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* URL Input with Scrape Button */}
                  <div className="form-group">
                    <label className="form-label">Profile URL</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={getPlaceholderURL()}
                        style={{ flex: 1 }}
                        {...register('profileURL', { required: 'Profile URL is required' })}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={scrapeProfile}
                        disabled={scraping || !profileURL}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {scraping ? (
                          <>⏳ Scraping...</>
                        ) : (
                          <>🌐 Auto-Fill</>
                        )}
                      </button>
                    </div>
                    {errors.profileURL && <span className="form-error">{errors.profileURL.message}</span>}
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Enter a profile URL and click "Auto-Fill" to fetch profile data automatically
                    </span>
                  </div>

                  {/* Platform-specific fields */}
                  {renderPlatformFields()}

                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Analyzing...' : '🔍 Analyze Profile'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </>
      )}

      {step === 2 && result && (
        <div className="two-col">
          {/* Result Card */}
          <div className={`result-card ${getVerdictClass(result.verdict)}`}>
            <div className="result-header">
              <div className={`result-verdict ${getVerdictClass(result.verdict)}`}>
                {getVerdictLabel(result.verdict)}
              </div>
              <div className="result-message">
                {getVerdictMessage(result.verdict)}
              </div>
            </div>

            <div className="gauge-wrap">
              <svg className="gauge-svg" viewBox="0 0 180 110">
                <path d="M 20 100 A 70 70 0 0 1 160 100" stroke="#1a2a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>
                <path
                  d="M 20 100 A 70 70 0 0 1 160 100"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="220"
                  strokeDashoffset={getScoreOffset(result.score)}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ff9d"/>
                    <stop offset="50%" stopColor="#ffd166"/>
                    <stop offset="100%" stopColor="#ff4d6d"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="gauge-number">
                <div className={`gauge-val ${getVerdictClass(result.verdict)}`}>{result.score}</div>
                <div className="gauge-label">FAKE SCORE</div>
              </div>
            </div>

            <div className="result-actions">
              <button className="btn btn-primary" onClick={submitReport} disabled={submitting}>
                {submitting ? 'Submitting...' : '📋 Submit Report'}
              </button>
              <button className="btn btn-ghost" onClick={startNewAnalysis}>
                🔍 New Analysis
              </button>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">🧠 AI Score Breakdown</div>
            </div>
            <div className="gauge-container">
              <div className="selected-account">
                <div className="selected-name">{formData?.profileURL}</div>
                <div className="selected-url">{selectedPlatform} profile</div>
              </div>

              <div className="score-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Profile Completeness</span>
                    <span className="breakdown-val">{formData?.hasProfilePic ? '100%' : '50%'}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill blue" style={{ width: formData?.hasProfilePic ? '100%' : '50%' }}></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Follower/Following Ratio</span>
                    <span className="breakdown-val">
                      {formData?.followingCount > 0
                        ? Math.min(100, Math.round((formData?.followerCount / formData?.followingCount) * 20))
                        : 0}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${result.score > 70 ? 'red' : result.score > 40 ? 'yellow' : 'green'}`}
                      style={{ width: `${formData?.followingCount > 0 ? Math.min(100, Math.round((formData?.followerCount / formData?.followingCount) * 20)) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Account Age Factor</span>
                    <span className="breakdown-val">{Math.min(100, Math.round((formData?.accountAgeDays || 0) / 3.65))}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill blue" style={{ width: `${Math.min(100, Math.round((formData?.accountAgeDays || 0) / 3.65))}%` }}></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Content Activity</span>
                    <span className="breakdown-val">{Math.min(100, (formData?.postCount || 0) * 2)}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill green" style={{ width: `${Math.min(100, (formData?.postCount || 0) * 2)}%` }}></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Overall Risk Score</span>
                    <span className="breakdown-val">{result.score}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${result.score > 70 ? 'red' : result.score > 40 ? 'yellow' : 'green'}`} style={{ width: `${result.score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
