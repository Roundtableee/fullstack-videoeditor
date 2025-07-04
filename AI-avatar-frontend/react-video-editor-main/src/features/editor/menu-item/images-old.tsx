// File: react-video-editor-main/src/features/editor/menu-item/images.tsx

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IMAGES as STATIC_IMAGES } from "../data/images";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";
import Draggable from "@/components/shared/draggable";
import { IImage } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { ADD_ITEMS } from "@designcombo/state";

export const Images: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IImage>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = Array.isArray(STATIC_IMAGES)
      ? STATIC_IMAGES.filter((img) => typeof img?.preview === "string")
      : [];
    console.log("Initial IMAGES from static:", initial);
    setLibrary(initial);
  }, []);

  const handleButtonClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log("Image file selected:", file);
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (jpg, png, gif, etc.)");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const uploadEndpoint = `${backendUrl}/upload/image`;
      console.log("Uploading image to:", uploadEndpoint);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });
      console.log("Upload response status:", response.status);
      if (!response.ok) {
        throw new Error(`อัปโหลดรูปภาพล้มเหลว (status ${response.status})`);
      }

      const data: { id: string; url: string; type: string } = await response.json();
      console.log("Upload response JSON:", data);

      if (data.type !== "image") {
        throw new Error("ไฟล์ที่อัปโหลดไม่ใช่รูปภาพ");
      }

      let imageUrl: string;
      if (data.url.startsWith("http")) {
        imageUrl = data.url;
      } else {
        imageUrl = `${backendUrl}${data.url}`;
      }
      console.log("Final imageUrl used:", imageUrl);

      const newImage: Partial<IImage> = {
        id: data.id,
        type: "image",
        details: ({ src: imageUrl } as IImage["details"]),
        preview: imageUrl,
      };

      console.log("New image item:", newImage);
      STATIC_IMAGES.unshift(newImage as IImage);
      console.log("Updated STATIC_IMAGES:", STATIC_IMAGES);

      console.log("Updating library state...");
      setLibrary([...STATIC_IMAGES]);
      console.log("Library state after update:", [...STATIC_IMAGES]);
    } catch (err) {
      console.error("Image upload error:", err);
      setError("เกิดข้อผิดพลาดขณะอัปโหลดรูปภาพ");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddImage = (image: Partial<IImage>) => {
    const id = generateId();
    console.log("Dispatching ADD_ITEMS for image:", image);
    dispatch(ADD_ITEMS, {
      payload: {
        trackItems: [
          {
            id,
            type: "image",
            display: {
              from: 0,
              to: 5000,
            },
            details: { src: image.details?.src ?? "" } as IImage["details"],
            metadata: {},
          },
        ],
      },
    });
  };

  const onWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  console.log("Rendering Images component, library:", library);

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Photos
      </div>

      <div className="px-4 mb-2">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
          className={`px-4 py-2 text-white rounded-md ${
            isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isUploading ? "กำลังอัปโหลด..." : "Upload รูปภาพ"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4"
        onWheel={onWheelScroll}
      >
        <ScrollArea>
          <div className="masonry-sm px-4 pb-4">
            {library.length > 0 ? (
              library.map((img) => {
                if (!img || typeof img.preview !== "string") {
                  console.warn("Skipping invalid image item:", img);
                  return null;
                }
                console.log("Rendering image preview:", img);
                return (
                  <Draggable
                    key={img.id}
                    data={img as IImage}
                    renderCustomPreview={
                      <div
                        style={{
                          backgroundImage: `url(${img.preview})`,
                          backgroundSize: "cover",
                          width: "80px",
                          height: "80px",
                        }}
                        className="draggable rounded"
                      />
                    }
                    shouldDisplayPreview={!isDragging}
                  >
                    <div
                      onClick={() => handleAddImage(img)}
                      className="flex w-full items-center justify-center overflow-hidden bg-background pb-2 cursor-pointer"
                    >
                      <img
                        draggable={false}
                        crossOrigin="anonymous"
                        src={img.preview}
                        alt={img.details?.src || "Image"}
                        className="h-full w-full rounded-md object-cover"
                        onError={(e) =>
                          console.error("Image preview load error:", e.currentTarget.src)
                        }
                      />
                    </div>
                  </Draggable>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                ยังไม่มีรูปภาพในคลัง <br />
                ลองกด Upload รูปจากเครื่องดูสิ
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Images;
