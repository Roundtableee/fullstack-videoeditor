export interface ITrackItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text';
  display: {
    from: number;
    to: number;
    position?: {
      x: number | string;
      y: number | string;
    };
  };
  trim: {
    from: number;
    to: number;
  };
  details: {
    src?: string;
    width?: number;
    height?: number;
    left?: number;  // Position from editor
    top?: number;   // Position from editor
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    [key: string]: any;
  };
  animations?: {
    in?: IBasicAnimation;
    out?: IBasicAnimation;
  };
  playbackRate?: number;
}

export interface ITransition {
  id: string;
  type: string;
  duration: number;
  settings?: Record<string, any>;
}

export interface IBasicAnimation {
  name: string;
  composition: ICompositionAnimation[];
}

export interface ICompositionAnimation {
  property: string;
  from: number;
  to: number;
  durationInFrames: number;
  easing?: string;
}

export interface VideoRenderOptions {
  fps: number;
  size: { width: number; height: number };
  format: string;
  quality?: number;
  crf?: number;
}

export interface RenderJobData {
  id: string;
  design: {
    trackItems: ITrackItem[];
    transitions: ITransition[];
  };
  options: VideoRenderOptions;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  outputPath?: string;
  error?: string;
}

export interface VideoStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  url?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoRenderResponse {
  video: VideoStatus;
}
