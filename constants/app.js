/**
 * Application-wide constants
 */

// File Upload Settings
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos

export const ALLOWED_DOCUMENT_TYPES = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  'xls', 'xlsx', 'csv', 'ods',
  'ppt', 'pptx', 'odp'
];

export const ALLOWED_IMAGE_TYPES = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_IMAGE_TYPES,
  'zip', 'rar', '7z'
];

// Text Length Limits
export const MAX_COMMUNITY_NAME_LENGTH = 50;
export const MIN_COMMUNITY_NAME_LENGTH = 3;
export const MAX_COMMUNITY_DESCRIPTION_LENGTH = 500;

export const MAX_EVENT_TITLE_LENGTH = 100;
export const MIN_EVENT_TITLE_LENGTH = 3;
export const MAX_EVENT_DESCRIPTION_LENGTH = 1000;
export const MAX_EVENT_LOCATION_LENGTH = 200;

export const MAX_CHANNEL_NAME_LENGTH = 50;
export const MIN_CHANNEL_NAME_LENGTH = 2;

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_BIO_LENGTH = 300;

// Pagination & Limits
export const MESSAGE_BATCH_SIZE = 50;
export const EVENTS_PER_PAGE = 20;
export const COMMUNITIES_PER_PAGE = 20;
export const FILES_PER_PAGE = 30;
export const CONNECTIONS_PER_PAGE = 20;

// Event Settings
export const MAX_EVENT_PARTICIPANTS = 100;
export const MIN_EVENT_PARTICIPANTS = 2;
export const DEFAULT_EVENT_PARTICIPANTS = 10;

// Community Settings
export const MAX_CHANNELS_PER_COMMUNITY = 20;
export const DEFAULT_CHANNEL_NAME = 'general';

// Profile Settings
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MIN_SKILLS_REQUIRED = 1;
export const MAX_SKILLS_ALLOWED = 10;
export const MAX_NEEDS_ALLOWED = 10;

// Profile Visibility Options
export const VISIBILITY_OPTIONS = {
  PUBLIC: 'public',
  CONNECTIONS: 'connections',
  PRIVATE: 'private',
};

export const DEFAULT_PROFILE_VISIBILITY = {
  showInDiscover: true,
  showSkills: VISIBILITY_OPTIONS.PUBLIC,
  showNeeds: VISIBILITY_OPTIONS.PUBLIC,
  showBio: VISIBILITY_OPTIONS.PUBLIC,
  showStreak: VISIBILITY_OPTIONS.PUBLIC,
  showEmail: VISIBILITY_OPTIONS.CONNECTIONS,
};

// Streak Settings
export const STREAK_RESET_HOURS = 24;
export const MIN_ACTIVITY_FOR_STREAK = 1; // Minimum actions per day to maintain streak

// Notification Settings
export const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  NEW_MESSAGE: 'new_message',
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATE: 'event_update',
  EVENT_CANCELLED: 'event_cancelled',
  COMMUNITY_INVITE: 'community_invite',
  NEW_MATCH: 'new_match',
};

// Moderation
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

export const MAX_REPORT_DESCRIPTION_LENGTH = 500;

// Time Formats
export const DATE_FORMAT = 'MMM d, yyyy';
export const TIME_FORMAT = 'h:mm a';
export const DATETIME_FORMAT = 'MMM d, yyyy • h:mm a';
export const MESSAGE_TIME_FORMAT = 'h:mm a';

// Avatar & Images
export const DEFAULT_AVATAR_COLOR = '#6200EE';
export const AVATAR_COLORS = [
  '#6200EE', '#03DAC6', '#FF0266', '#00C853',
  '#FF6D00', '#2979FF', '#D500F9', '#00BFA5',
];

// Search & Debounce
export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

// Matching Algorithm
export const MIN_MATCH_SCORE = 0.3; // 30% minimum compatibility
export const MAX_MATCHES_TO_SHOW = 20;

// Storage Paths
export const STORAGE_PATHS = {
  PROFILE_PICTURES: 'profile-pictures',
  COMMUNITY_FILES: 'community-files',
  CHAT_MEDIA: 'chat-media',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  FILE_TOO_LARGE: 'File is too large. Please select a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  AUTH_ERROR: 'Authentication error. Please log in again.',
  NOT_FOUND: 'Resource not found.',
};

// Community Icons (emoji options for community creation)
export const COMMUNITY_ICONS = [
  '📚', '🧮', '🔬', '💻', '🎨', '🎵', '🌍', '📖',
  '✏️', '🎓', '🧪', '📐', '🎭', '🎬', '📱', '🚀',
  '💡', '🔍', '🧠', '📊', '🗣️', '🎯', '🏆', '⚡',
];

// Default Values
export const DEFAULT_VALUES = {
  EVENT_MAX_PARTICIPANTS: 10,
  COMMUNITY_ICON: '📚',
  MESSAGE_BATCH_SIZE: 50,
  NOTIFICATION_BATCH_SIZE: 20,
};

// Feature Flags (for gradual rollout of features)
export const FEATURE_FLAGS = {
  ENABLE_FILE_LIBRARY: true,
  ENABLE_VIDEO_CALLS: false,
  ENABLE_VOICE_CALLS: false,
  ENABLE_REACTIONS: false,
  ENABLE_POLLS: false,
  ENABLE_BADGES: false,
};
