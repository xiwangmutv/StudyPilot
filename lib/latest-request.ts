/** Keeps async UI work ordered: only the latest request may update the UI. */
export class LatestRequest {
  private sequence = 0;
  private controller: AbortController | null = null;

  begin() {
    this.controller?.abort();
    this.controller = new AbortController();
    return { id: ++this.sequence, signal: this.controller.signal };
  }

  isLatest(id: number) {
    return id === this.sequence;
  }

  cancel() {
    this.controller?.abort();
    this.controller = null;
    this.sequence += 1;
  }
}
