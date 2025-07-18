// This file is now a direct adaptation of videos.tsx for handling images.

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import Draggable from "@/components/shared/draggable";
import { IMAGES as STATIC_IMAGES } from "../data/images";
import { dispatch } from "@designcombo/events";
import { ADD_ITEMS } from "@designcombo/state";
import { IImage } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { generateId } from "@designcombo/timeline";
import { Trash2 } from "lucide-react";
import { fileUploadService } from "@/services/upload";

export const Images: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  // Combine static and uploaded images into a single library state
  const [library, setLibrary] = useState<Partial<IImage>[]>([...STATIC_IMAGES]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load uploaded images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem('uploadedImages');
    if (savedImages) {
      try {
        const uploadedImages = JSON.parse(savedImages);
        setLibrary(prev => [...uploadedImages, ...STATIC_IMAGES]);
      } catch (error) {
        console.error('Error loading saved images:', error);
      }
    }
  }, []);

  // Save uploaded images to localStorage whenever library changes
  useEffect(() => {
    const uploadedImages = library.filter(image => 
      image.metadata?.uploadedAt && !STATIC_IMAGES.find(si => si.id === image.id)
    );
    if (uploadedImages.length > 0) {
      localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
    }
  }, [library]);

  const addToTimeline = (item: Partial<IImage>) => {
    const trackId = generateId();
    dispatch(ADD_ITEMS, {
      payload: {
        trackItems: [
          {
            id: trackId,
            type: "image",
            display: { from: 0, to: 5000 }, // Default 5 seconds
            details: { src: item.preview },
            metadata: item.metadata || {}
          },
        ],
      },
    });
  };

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const uploadEndpoint = "/api/upload/single";
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`อัปโหลดรูปภาพล้มเหลว (status ${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.type !== "image") {
        throw new Error("ไฟล์ที่อัปโหลดไม่ใช่รูปภาพ");
      }

      const newItem: Partial<IImage> = {
        id: data.id,
        type: "image",
        name: data.filename || file.name, // ใช้ filename ที่ decoded จาก backend
        preview: data.url, // For images, preview is the URL itself
        metadata: {
          filename: data.filename || file.name, // ชื่อไฟล์ภาษาไทยที่ถูกต้อง
          originalname: data.originalname || file.name, // ชื่อไฟล์ต้นฉบับ
          size: data.size,
          uploadedAt: new Date().toISOString(),
        },
      };

      setLibrary(prev => [newItem, ...prev]);
    } catch (err: any) {
      console.error("Upload error:", err);
      let errorMessage = "ไม่สามารถอัปโหลดรูปภาพได้";
      if (err.message) {
        if (err.message.includes("NetworkError") || err.message.includes("fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับ server ได้ กรุณาตรวจสอบว่า backend server ทำงานอยู่";
        } else if (err.message.includes("status 413")) {
          errorMessage = "ไฟล์รูปภาพมีขนาดใหญ่เกินไป (max 50MB)";
        } else {
          errorMessage = err.message;
        }
      }
      alert(errorMessage);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const onWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  const handleDeleteImage = async (image: Partial<IImage>, event: React.MouseEvent) => {
    event.stopPropagation(); // ป้องกันไม่ให้ trigger การ click ของ parent
    
    try {
      // ลบจาก localStorage ก่อน
      const updatedLibrary = library.filter(item => item.id !== image.id);
      setLibrary(updatedLibrary);
      
      // อัปเดต localStorage
      const uploadedImages = updatedLibrary.filter(item => 
        !STATIC_IMAGES.some(staticImage => staticImage.id === item.id)
      );
      localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
      
      // ลบไฟล์จาก backend (ถ้าเป็น uploaded file)
      if (image.id && !STATIC_IMAGES.some(staticImage => staticImage.id === image.id)) {
        try {
          await fileUploadService.deleteFile(image.id);
          console.log('Image deleted from server:', image.id);
        } catch (error) {
          console.warn('Failed to delete from server:', error);
          // ไม่ต้อง revert localStorage เพราะ user อาจต้องการลบแค่จาก local
        }
      }
      
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="h-12 flex items-center px-4 text-lg font-medium text-text-primary">
        Images
      </div>

      <div className="mb-4 px-4">
        <label className={`inline-block px-4 py-2 text-white rounded-lg transition-colors ${
          isUploading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
        }`}>
          {isUploading ? "กำลังอัปโหลด..." : "Upload Image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileSelected}
            disabled={isUploading}
          />
        </label>
        {isUploading && (
          <p className="mt-2 text-sm text-gray-500">
            กำลังอัปโหลดรูปภาพ...
          </p>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4"
        onWheel={onWheelScroll}
      >
        <div className="space-y-4">
          {library.map((image) => {
            return (
              <Draggable
                key={image.id}
                data={image}
                renderCustomPreview={
                  <div
                    style={{
                      backgroundImage: `url(${image.preview})`,
                      backgroundSize: "cover",
                      width: "40px",
                      height: "40px",
                    }}
                    className="draggable rounded"
                  />
                }
                shouldDisplayPreview={!isDragging}
              >
                <div className="relative group">
                  <div
                    onClick={() => addToTimeline(image)}
                    className="flex w-full items-center justify-center overflow-hidden bg-background pb-2 rounded-lg cursor-pointer"
                  >
                    <img
                      draggable={false}
                      crossOrigin="anonymous"
                      src={image.preview!}
                      alt={image.name || "Image"}
                      className="aspect-video w-[160px] object-cover rounded-md"
                      onError={(e) =>
                        console.error("Image preview load error:", e.currentTarget.src)
                      }
                    />
                  </div>
                  
                  {/* Delete button - แสดงเฉพาะไฟล์ที่ upload */}
                  {!STATIC_IMAGES.some(staticImage => staticImage.id === image.id) && (
                    <button
                      onClick={(e) => handleDeleteImage(image, e)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  
                  {/* ชื่อไฟล์ */}
                  <div className="mt-1 px-1">
                    <p className="text-xs text-gray-600 truncate" title={image.name}>
                      {image.name}
                    </p>
                  </div>
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Images;