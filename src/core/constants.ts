export const COLORS = {
  primary: '#FF4500',
  secondary: '#8A2BE2',
  border: '#E5E7EB',
  text: {
    primary: '#111827',
    secondary: '#6B7280'
  }
} as const;

export const SUPPORTED_LANGUAGES = ['nl-NL', 'en-US', 'en-GB'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const TRANSFORM_FORMATS = {
  'business-letter': 'Zakelijke brief',
  'social-post': 'Social media post',
  'email': 'E-mail'
} as const;
export type TransformFormat = keyof typeof TRANSFORM_FORMATS;

export const MAX_AUDIO_DURATION = 300; // 5 minutes 