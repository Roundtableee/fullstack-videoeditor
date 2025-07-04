// File: react-video-editor-main/src/features/editor/menu-item/images.tsx

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";
import Draggable from "@/components/shared/draggable";
import { IImage } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { ADD_ITEMS } from "@designcombo/state";
import { IMAGES as STATIC_IMAGES } from "../data/images";
import { Image as ImageIcon, Upload, Plus } from "lucide-react";
import { fileUploadService, UploadedFile } from "@/services/upload";
import FileUpload from "../components/FileUpload";

export const Images: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IImage>[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load static images
    const initial = Array.isArray(STATIC_IMAGES)
      ? STATIC_IMAGES.filter((img) => typeof img?.preview === "string")
      : [];
    setLibrary(initial);
    
    // Load uploaded images
    loadUploadedImages();
  }, []);

  const loadUploadedImages = async () => {
    try {
      setLoading(true);
      const files = await fileUploadService.getUploadedFiles();
      const imageFiles = files.filter(file => file.type === 'image');
      setUploadedImages(imageFiles);
    } catch (error) {
      console.error('Failed to load uploaded images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    const imageFiles = files.filter(file => file.type === 'image');
    setUploadedImages(prev => [...prev, ...imageFiles]);
    setShowUpload(false);
  };

  const convertUploadedToImage = (file: UploadedFile): Partial<IImage> => ({
    id: file.id,
    name: file.filename,
    preview: file.url,
    type: 'image',
    metadata: { author: "Uploaded" }
  });

  // Wheel scroll support
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  // Combine static and uploaded images
  const allImages = [
    ...library,
    ...uploadedImages.map(convertUploadedToImage)
  ];

  // Add image to timeline
  const addToTimeline = (image: Partial<IImage>) => {
    const trackId = generateId();
    dispatch(ADD_ITEMS, {
      payload: {
        trackItems: [
          {
            id: trackId,
            type: "image",
            display: { from: 0, to: 5000 }, // 5 seconds default
            details: { src: image.preview },
            metadata: image.metadata || {}
          },
        ],
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Library
        </h3>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 border-b bg-white">
          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            acceptedTypes={['image/*']}
            maxFiles={10}
            maxSize={50 * 1024 * 1024} // 50MB
          />
        </div>
      )}

      {/* Image Grid */}
      <ScrollArea className="flex-1" ref={scrollRef} onWheel={onWheel}>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading images...</div>
          ) : allImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allImages.map((image) => (
                <ImageListItem
                  key={image.id}
                  image={image}
                  isDragging={isDragging}
                  onAdd={() => addToTimeline(image)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images</h3>
              <p className="text-gray-500 mb-4">
                Upload your first image to get started.
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Separate component for image list item
const ImageListItem: React.FC<{
  image: Partial<IImage>;
  isDragging: boolean;
  onAdd: () => void;
}> = ({ image, isDragging, onAdd }) => {
  return (
    <Draggable
      data={{
        id: generateId(),
        type: "image",
        name: image.name,
        preview: image.preview,
        metadata: image.metadata
      }}
    >
      <div
        className={`
          cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 
          bg-white overflow-hidden hover:shadow-md transition-shadow group
          ${isDragging ? "opacity-50" : ""}
        `}
      >
        <div className="aspect-square relative">
          <img
            src={image.preview}
            alt={image.name || "Image"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Add
            </Button>
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-medium text-gray-900 truncate">
            {image.name || "Untitled"}
          </p>
          {image.metadata?.author && (
            <p className="text-xs text-gray-500">
              {image.metadata.author}
            </p>
          )}
        </div>
      </div>
    </Draggable>
  );
};
