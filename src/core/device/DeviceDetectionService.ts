import { BrowserType, DeviceType } from '@/types/speech.types';

export class DeviceDetectionService {
  public isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public getBrowserType(): BrowserType {
    const ua = navigator.userAgent;
    if (/chrome|chromium/i.test(ua)) return 'chrome';
    if (/firefox/i.test(ua)) return 'firefox';
    if (/safari/i.test(ua)) return 'safari';
    return 'other';
  }

  public getDeviceType(): DeviceType {
    const ua = navigator.userAgent;
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'tablet';
    if (this.isMobile()) return 'mobile';
    return 'desktop';
  }

  public getSpeechRecognitionConfig(): { continuous: boolean; interimResults: boolean } {
    const deviceType = this.getDeviceType();
    const browserType = this.getBrowserType();

    // Specifieke configuratie voor mobiele Chrome browsers
    if (deviceType === 'mobile' && browserType === 'chrome') {
      return {
        continuous: false,
        interimResults: true
      };
    }

    // Standaard configuratie voor andere apparaten/browsers
    return {
      continuous: false,
      interimResults: false
    };
  }
} 