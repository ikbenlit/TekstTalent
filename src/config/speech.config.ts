import { BrowserType } from '../types/speech.types';
import { DeviceDetectionService } from '../core/device/DeviceDetectionService';

// Type guard toevoegen voor browser info
interface BrowserInfo {
  type: string;
  version: string;
}

// Zorg dat browserType altijd een geldige key is
const isValidBrowserType = (type: string): type is BrowserType => {
  return ['chrome', 'safari', 'firefox', 'other'].includes(type);
};

export interface SpeechConfig {
  // Basis spraakherkenning opties
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  // Timing configuratie
  maxDuration: number;      // Maximum opnametijd in ms (0 = ongelimiteerd)
  restartDelay: number;     // Delay tussen pogingen
  silenceTimeout?: number;  // Timeout voor stilte detectie
  
  // Retry logica
  maxRetries: number;       // Maximum aantal hertries bij fouten
  autoRestart: boolean;     // Automatisch herstarten na stilte/error
  
  // Event handlers configuratie
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
  onResult?: (text: string, isFinal: boolean) => void;

  // Silence detection configuratie
  silenceThreshold?: number;    // Minimum stilte duur voor actie
  silenceActions?: {
    onSilenceStart?: () => void;
    onSilenceEnd?: () => void;
    stopOnSilence?: boolean;    // Stop recognition bij stilte
    restartOnSilence?: boolean; // Herstart recognition bij stilte
  };
}

export const defaultConfig: SpeechConfig = {
  continuous: true,
  interimResults: true,
  lang: 'nl-NL',
  maxAlternatives: 1,
  maxDuration: 0,
  restartDelay: 300,
  maxRetries: 3,
  autoRestart: true,
  silenceTimeout: 3000,
  silenceThreshold: 500,
  silenceActions: {
    stopOnSilence: false,
    restartOnSilence: false
  }
};

export const mobileConfig: Partial<SpeechConfig> = {
  continuous: false,
  interimResults: true,
  maxDuration: 10000,
  restartDelay: 300,
  maxRetries: 2,
  silenceTimeout: 1500,
  silenceThreshold: 500,
  silenceActions: {
    stopOnSilence: true,
    restartOnSilence: true
  }
};

export const browserConfigs: Record<BrowserType, Partial<SpeechConfig>> = {
  chrome: {
    maxAlternatives: 3,
    autoRestart: true,
    continuous: true,
    maxDuration: 0,
  },
  safari: {
    maxAlternatives: 1,
    silenceTimeout: 2500,
    autoRestart: false,
    restartDelay: 800,
    continuous: false
  },
  firefox: {
    maxAlternatives: 1,
    restartDelay: 400,
    continuous: true
  },
  other: {
    continuous: false,
    maxDuration: 5000,
    restartDelay: 1000
  }
} as const;

export function createSpeechConfig(
  deviceDetection: DeviceDetectionService
): SpeechConfig {
  const capabilities = deviceDetection.getSpeechRecognitionCapabilities();
  const browserInfo = deviceDetection.getBrowserInfo();
  
  // Start met strikte defaults
  const config: SpeechConfig = {
    ...defaultConfig,
    continuous: capabilities.supportsContinuous,
    interimResults: capabilities.supportsInterimResults
  };
  
  // Voeg mobiele config toe indien nodig
  if (deviceDetection.isMobile()) {
    Object.assign(config, mobileConfig);
  }
  
  // Voeg browser-specifieke config toe met type checking
  const browserType = isValidBrowserType(browserInfo.type) ? browserInfo.type : 'other';
  const browserConfig = browserConfigs[browserType];
  
  if (browserConfig) {
    Object.assign(config, browserConfig);
  }
  
  // Override met capabilities
  if (capabilities.recommendedTimeout > 0) {
    config.maxDuration = capabilities.recommendedTimeout;
  }
  
  // Override continuous mode voor desktop/mobiel
  if (deviceDetection.isMobile()) {
    config.continuous = false;
  } else {
    config.continuous = true;
  }
  
  return config;
} 