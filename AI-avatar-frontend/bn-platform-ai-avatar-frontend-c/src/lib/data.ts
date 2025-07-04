import { NavItem, VideoTool } from './types';

export const mainNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: 'home',
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: 'folder',
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: 'layout-template',
  },
];

export const assetNavItems: NavItem[] = [
  {
    name: 'Avatars',
    href: '/avatars',
    icon: 'user',
  },
  {
    name: 'Voice',
    href: '/voice',
    icon: 'message-square',
  },
  {
    name: 'Brand',
    href: '/brand',
    icon: 'layers',
  },
  {
    name: 'Uploads',
    href: '/uploads',
    icon: 'upload',
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: 'puzzle',
  },
];

export const videoTools: VideoTool[] = [
  {
    id: 'photo-to-video',
    title: 'Photo to Video with Avatar',
    description: 'Turn a photo and script into a realistic talking video',
    imageSrc: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    tag: {
      text: 'NEW',
      type: 'new',
    },
  },
  {
    id: 'create-video',
    title: 'Create a Video',
    description: 'Script, edit, and produce videos with avatars in our studio',
    imageSrc: 'https://images.pexels.com/photos/3760610/pexels-photo-3760610.jpeg',
    tag: {
      text: 'POPULAR',
      type: 'popular',
    },
  },
  {
    id: 'translate-video',
    title: 'Translate a Video',
    description: 'Translate videos while retaining original voice and natural lip sync.',
    imageSrc: 'https://images.pexels.com/photos/789822/pexels-photo-789822.jpeg',
  },
  {
    id: 'ppt-to-video',
    title: 'PPT/PDF to Video',
    description: 'Convert presentations into videos.',
    imageSrc: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg',
  },
];