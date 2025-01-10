export class DebugLogger {
  private static logs: string[] = [];
  private static maxLogs: number = 1000;

  static log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = data 
      ? `${timestamp} ${message} ${JSON.stringify(data)}`
      : `${timestamp} ${message}`;
    
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  static error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = error
      ? `${timestamp} ERROR: ${message} ${JSON.stringify(error)}`
      : `${timestamp} ERROR: ${message}`;
    
    this.logs.push(logEntry);
  }

  static getLogs(): string {
    return this.logs.map(log => log.replace(/^[^Z]+Z\s/, '')).join('\n');
  }

  static clear(): void {
    this.logs = [];
  }
} 