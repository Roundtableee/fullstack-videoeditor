export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export interface VideoTool {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  tag?: {
    text: string;
    type: 'new' | 'popular' | 'default';
  };
}

export interface CachedVideo {
  file: File;
  preview: string;
  metadata: {
    duration: number;
    size: number;
    format: string;
    width: number;
    height: number;
    bitrate?: number;
  };
  cache: {
    timestamp: number;
    expiration: number;
    key: string;
  };
  status: {
    isLoading: boolean;
    error?: string;
    progress: number;
  };
}
