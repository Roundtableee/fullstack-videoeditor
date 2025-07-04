// File: react-video-editor-main/src/features/editor/timeline/items/audio.ts

import {
  Audio as AudioBase,
  AudioProps,
  Control,
  timeMsToUnits,
} from "@designcombo/timeline";
import {
  AudioData,
  getAudioData,
  getWaveformPortion,
} from "@remotion/media-utils";
import { IDisplay } from "@designcombo/types";
import { SECONDARY_FONT } from "../../constants/constants";
import { createAudioControls } from "../controls";

const MAX_CANVAS_WIDTH = 12000;
const CANVAS_SAFE_DRAWING = 2000;

class Audio extends AudioBase {
  static type = "Audio";
  public barData?: AudioData;
  public tScale: number;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  public scrollLeft = 0;
  public display: IDisplay;
  private isDirty = true;
  declare playbackRate: number;
  public bars: Array<{ amplitude: number }> = [];

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createAudioControls() };
  }

  constructor(props: AudioProps) {
    super(props);
    // guarantee display and tScale
    this.display = props.display!;
    this.tScale = props.tScale ?? 1;

    this.fill = "#00586c";
    this.objectCaching = false;
    this.initOffscreenCanvas();
    this.initialize();
  }

  private async initialize() {
    this.barData = await getAudioData(this.src);
    this.bars = (this.getBars(0, 0) as Array<{ amplitude: number }>) || [];
    this.canvas?.requestRenderAll();
    this.onScrollChange({ scrollLeft: 0 });
  }

  public setSrc(src: string) {
    this.src = src;
    this.initOffscreenCanvas();
    this.initialize();
    this.setCoords();
    this.canvas?.requestRenderAll();
  }

  private getBars(start: number, duration: number) {
    if (!this.barData) return [];
    const totalMs = this.display.to - this.display.from;
    const units = timeMsToUnits(totalMs, this.tScale, this.playbackRate);
    return getWaveformPortion({
      audioData: this.barData,
      startTimeInSeconds: (start + this.display.from) / 1000,
      durationInSeconds:
        duration > 0
          ? duration / 1000
          : this.barData.durationInSeconds,
      numberOfSamples: Math.round(units / 4),
    }).map(bar => ({ amplitude: bar.amplitude ?? 0 }));
  }

  private initOffscreenCanvas() {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }
    if (
      this.offscreenCanvas.width !== this.width ||
      this.offscreenCanvas.height !== this.height
    ) {
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.isDirty = true;
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawTextIdentity(ctx);
    this.updateSelected(ctx);

    if (!this.display || !this.offscreenCanvas) return;

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    this.renderToOffscreen();

    const fromUnits = timeMsToUnits(this.display.from, this.tScale);
    const scrollPos = this.scrollLeft + fromUnits;
    const visibleStart = Math.max(0, -scrollPos) - CANVAS_SAFE_DRAWING;

    ctx.drawImage(
      this.offscreenCanvas,
      0,
      0,
      this.offscreenCanvas.width,
      this.height,
      visibleStart,
      0,
      this.offscreenCanvas.width,
      this.height
    );
    ctx.restore();
    this.canvas?.requestRenderAll();
  }

  private drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(
      "M8.24092 0C8.24092 2.51565 10.2795 4.55419 12.7951 4.55419C12.9677 4.55419 13.1331 4.62274 13.2552 4.74475C13.3772 4.86676 13.4457 5.03224 13.4457 5.20479C13.4457 5.37734 13.3772 5.54282 13.2552 5.66483C13.1331 5.78685 12.9677 5.85539 12.7951 5.85539C11.9218 5.85605 11.0594 5.66105 10.2713 5.28471C9.48319 4.90838 8.78942 4.36027 8.24092 3.68066V13.8794C8.24094 14.8271 7.91431 15.7458 7.31606 16.4808C6.71781 17.2157 5.88451 17.722 4.95657 17.9143C4.02863 18.1066 3.06276 17.9731 2.22172 17.5364C1.38067 17.0997 0.715856 16.3865 0.339286 15.5169C-0.0372842 14.6473 -0.10259 13.6744 0.154372 12.7622C0.411334 11.8501 0.974857 11.0544 1.74999 10.5092C2.52512 9.96403 3.46449 9.7027 4.40981 9.76924C5.35512 9.83579 6.24861 10.2261 6.93972 10.8745V0H8.24092ZM6.93972 13.8794C6.93972 13.1317 6.6427 12.4146 6.11398 11.8859C5.58527 11.3572 4.86818 11.0602 4.12046 11.0602C3.37275 11.0602 2.65566 11.3572 2.12694 11.8859C1.59823 12.4146 1.3012 13.1317 1.3012 13.8794C1.3012 14.6272 1.59823 15.3443 2.12694 15.873C2.65566 16.4017 3.37275 16.6987 4.12046 16.6987C4.86818 16.6987 5.58527 16.4017 6.11398 15.873C6.6427 15.3443 6.93972 14.6272 6.93972 13.8794Z"
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 6);
    ctx.font = `400 12px ${SECONDARY_FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Audio", 36, 16);
    ctx.translate(8, 1);
    ctx.fill(icon);
    ctx.restore();
  }

  // changed from private -> public
  public updateSelected(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      6
    );
    ctx.strokeStyle = this.isSelected
      ? "rgba(255,255,255,1)"
      : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  public onScrollChange({ scrollLeft }: { scrollLeft: number }) {
    this.scrollLeft = scrollLeft;
    this.isDirty = true;
  }

  public renderToOffscreen(force = false) {
    if (!this.offscreenCtx || (!this.isDirty && !force)) return;
    if (!this.display) return;

    this.offscreenCanvas!.width = MAX_CANVAS_WIDTH;
    this.offscreenCanvas!.height = this.height;
    const ctx = this.offscreenCtx!;
    ctx.clearRect(0, 0, this.offscreenCanvas!.width, this.height);

    ctx.beginPath();
    ctx.roundRect(0, 0, this.offscreenCanvas!.width, this.height, this.rx);
    ctx.clip();

    const fromUnits = timeMsToUnits(this.display.from, this.tScale);
    const scrollPos = this.scrollLeft + fromUnits;
    const trimUnits = timeMsToUnits(
      this.trim.from,
      this.tScale,
      this.playbackRate
    );
    const visibleStart =
      Math.max(0, -scrollPos) - CANVAS_SAFE_DRAWING + trimUnits;
    const visibleWidth = MAX_CANVAS_WIDTH;

    const barWidth = 4;
    const startIndex = Math.max(0, Math.floor(visibleStart / barWidth));
    const endIndex = Math.min(
      this.bars.length,
      Math.ceil((visibleStart + visibleWidth) / barWidth)
    );

    if (startIndex < endIndex) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      for (let i = startIndex; i < endIndex; i++) {
        const bar = this.bars[i];
        if (!bar) continue;
        const amp = bar.amplitude ?? 0;
        const h = Math.round(amp * 15);
        const x = Math.round(i * barWidth - visibleStart);
        const y = Math.round((20 - h) / 2 + 8);
        ctx.rect(x, y, 1, h);
      }
      ctx.fill();
    }

    this.isDirty = false;
  }

  public onResizeSnap() {
    this.renderToOffscreen(true);
  }
  public onResize() {
    this.renderToOffscreen(true);
  }
  public onScale() {
    this.bars = (this.getBars(0, 0) as any) || [];
    this.onScrollChange({ scrollLeft: this.scrollLeft });
  }
}

export default Audio;
