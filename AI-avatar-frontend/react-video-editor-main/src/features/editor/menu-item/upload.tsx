// src/features/editor/menu-item/upload.ts

import { generateId } from "@designcombo/timeline";
import type { IVideo, IVideoDetails, IDisplay } from "@designcombo/types";

/**
 * รับไฟล์ MP4 หลายไฟล์ สร้าง Blob URL แล้วคืน array ของ Partial<IVideo>
 */
export function uploadAndConvertVideos(
  files: File[]
): Partial<IVideo>[] {
  return files.map((file) => {
    // สร้าง URL ชั่วคราวจากไฟล์
    const url = URL.createObjectURL(file);

    // เตรียม details ให้ครบตาม IVideoDetails
    const details: IVideoDetails = {
      src:        url,
      width:      640,
      height:     360,
      blur:       0,
      brightness: 1,
      flipX:      false,
      flipY:      false,
      rotate:     "0",
      visibility: "visible",
    };

    // คืน Partial<IVideo> สำหรับ dispatch หรือแมปต่อ
    return {
      id:       generateId(),
      name:     file.name,
      type:     "video",
      display:  "inline-block" as unknown as IDisplay,
      metadata: { previewUrl: url },
      details,
      preview:  url,  // สำหรับ thumbnail/preview
    };
  });
}
