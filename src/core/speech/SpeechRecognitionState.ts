export class SpeechRecognitionState {
  private text = '';
  private isListening = false;
  private restartAttempts = 0;
  private readonly maxRestartAttempts = 3;

  public getText(): string {
    return this.text;
  }

  public appendText(newText: string): void {
    this.text = this.text ? `${this.text} ${newText}` : newText;
  }

  public clearText(): void {
    this.text = '';
  }

  public setListening(value: boolean): void {
    this.isListening = value;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public incrementRestartAttempts(): boolean {
    this.restartAttempts++;
    return this.restartAttempts < this.maxRestartAttempts;
  }

  public resetRestartAttempts(): void {
    this.restartAttempts = 0;
  }
} 