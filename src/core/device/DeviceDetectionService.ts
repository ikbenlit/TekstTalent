import { BrowserType, DeviceType } from '../../types/speech.types';

export class DeviceDetectionService {
  private userAgent = navigator.userAgent;
  private platform = navigator.platform;

  isMobile(): boolean {
    // Eerst check voor specifieke mobiele/tablet devices
    const isAndroid = /Android/i.test(this.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(this.platform) || 
      (this.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
    const isSamsung = /SM-|SAMSUNG|Samsung/i.test(this.userAgent);

    // Als het een bekend mobiel device is, altijd true
    if (isAndroid || isIOS || isSamsung) {
      console.log('Device Detection - Known Mobile:', {
        isAndroid,
        isIOS,
        isSamsung,
        userAgent: this.userAgent,
        platform: this.platform
      });
      return true;
    }

    // Fallback voor andere devices
    const result = this.hasMobileUserAgent() || 
      (this.hasTouchCapability() && window.innerWidth <= 1024);
    
    console.log('Device Detection - Fallback:', {
      userAgent: this.userAgent,
      platform: this.platform,
      hasMobileUA: this.hasMobileUserAgent(),
      hasTouch: this.hasTouchCapability(),
      width: window.innerWidth,
      isMobile: result
    });
    
    return result;
  }

  getBrowserInfo() {
    return {
      type: this.getBrowserType(),
      version: this.getBrowserVersion(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid()
    };
  }

  getSpeechRecognitionCapabilities() {
    const browserInfo = this.getBrowserInfo();
    
    return {
      supportsContinuous: !(this.isMobile() && (browserInfo.type === 'chrome' || browserInfo.type === 'safari')),
      supportsInterimResults: !this.isMobile(),
      hasNativeSpeechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      recommendedTimeout: this.getRecommendedTimeout()
    };
  }

  private hasMobileUserAgent(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(this.userAgent);
  }

  private hasTouchCapability(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private getBrowserType(): BrowserType {
    if (/Chrome/.test(this.userAgent) && !this.isIOS()) {
      return 'chrome';
    }
    if (/Safari/.test(this.userAgent) && !/Chrome/.test(this.userAgent)) {
      return 'safari';
    }
    if (/Firefox/.test(this.userAgent)) {
      return 'firefox';
    }
    return 'other';
  }

  private getBrowserVersion(): string {
    const matches = this.userAgent.match(/(chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    return matches[2] || '';
  }

  private isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(this.platform) ||
      // iPad op iOS 13+ detectie
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0)
    );
  }

  private isAndroid(): boolean {
    return /Android/.test(this.userAgent);
  }

  private getRecommendedTimeout(): number {
    if (this.isMobile()) {
      return this.isIOS() ? 7000 : 10000;
    }
    return 0; // Geen timeout voor desktop
  }
} 