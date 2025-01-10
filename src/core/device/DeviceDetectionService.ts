import { BrowserType, DeviceType } from '@/types/speech.types';

export class DeviceDetectionService {
  private userAgent: string;
  private platform: string;

  constructor() {
    this.userAgent = navigator.userAgent;
    this.platform = navigator.platform;
  }

  public isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent);
  }

  public isIOS(): boolean {
    // Modern iOS detection, inclusief iPad op iPadOS
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(this.platform) || 
    // iPad op iOS 13+ detectie
    (this.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
  }

  public isModernIPhone(): boolean {
    // iPhone X of nieuwer (iOS 11+)
    return /iPhone/.test(this.userAgent) && 
           (window.screen.height >= 812 || window.screen.width >= 812);
  }

  public getBrowserType(): BrowserType {
    const ua = this.userAgent.toLowerCase();
    
    // Safari versie detectie
    const safariVersion = ua.match(/version\/(\d+)/i);
    const isSafari = /safari/i.test(ua) && !/chrome|chromium/i.test(ua);
    
    // Chrome versie detectie
    const chromeVersion = ua.match(/(?:chrome|chromium)\/(\d+)/i);
    
    // Firefox versie detectie
    const firefoxVersion = ua.match(/firefox\/(\d+)/i);

    if (chromeVersion) {
      return 'chrome';
    }
    if (isSafari) {
      return 'safari';
    }
    if (firefoxVersion) {
      return 'firefox';
    }
    return 'other';
  }

  public getSafariVersion(): number | null {
    const match = this.userAgent.match(/version\/(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  public getIOSVersion(): number | null {
    const match = this.userAgent.match(/OS (\d+)_/i);
    return match ? parseInt(match[1], 10) : null;
  }

  public getDeviceType(): DeviceType {
    // iPad specifieke detectie
    if (/iPad|MacIntel/.test(this.platform) && navigator.maxTouchPoints > 0) {
      return 'tablet';
    }
    
    // iPhone/Android tablet detectie
    if (/iPad|Android(?!.*Mobile)|Tablet/.test(this.userAgent)) {
      return 'tablet';
    }

    // Modern iPhone detectie
    if (this.isModernIPhone()) {
      return 'mobile';
    }

    if (this.isMobile()) {
      return 'mobile';
    }

    return 'desktop';
  }

  public isAndroid(): boolean {
    return /Android/i.test(this.userAgent);
  }

  public getSpeechRecognitionConfig(): { continuous: boolean; interimResults: boolean } {
    const deviceType = this.getDeviceType();
    const browserType = this.getBrowserType();
    const iosVersion = this.getIOSVersion();
    const safariVersion = this.getSafariVersion();
    const isAndroid = this.isAndroid();

    // Specifieke configuratie voor Android Chrome
    if (isAndroid && browserType === 'chrome') {
      return {
        continuous: false,  // Android Chrome werkt beter zonder continuous mode
        interimResults: false  // Verminder complexiteit voor Android
      };
    }

    // Specifieke configuratie voor moderne iPhones met Safari
    if (this.isModernIPhone() && browserType === 'safari' && iosVersion && iosVersion >= 13) {
      return {
        continuous: false,
        interimResults: true
      };
    }

    // Specifieke configuratie voor mobiele Chrome browsers (niet-Android)
    if (deviceType === 'mobile' && browserType === 'chrome' && !isAndroid) {
      return {
        continuous: false,
        interimResults: true
      };
    }

    // Specifieke configuratie voor Safari desktop
    if (browserType === 'safari' && safariVersion && safariVersion >= 14) {
      return {
        continuous: true,
        interimResults: true
      };
    }

    // Configuratie voor tablets
    if (deviceType === 'tablet') {
      return {
        continuous: true,
        interimResults: true
      };
    }

    // Standaard configuratie voor desktop/andere apparaten
    return {
      continuous: true,
      interimResults: true
    };
  }
} 