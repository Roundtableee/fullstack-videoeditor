// File: react-video-editor-main/src/features/editor/menu-item/images-enhanced.tsx

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";
import Draggable from "@/components/shared/draggable";
import { IImage } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { ADD_ITEMS } from "@designcombo/state";
import { IMAGES as STATIC_IMAGES } from "../data/images";
import { Image as ImageIcon, Upload, Plus, Search, Filter, Eye, Palette } from "lucide-react";
import { fileUploadService, UploadedFile } from "@/services/upload";
import FileUpload from "../components/FileUpload";
import MediaCard from "../components/MediaCard";
import { cn } from "@/lib/utils";

export const ImagesEnhanced: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IImage>[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    setUploadedImages(prev => [...imageFiles, ...prev]);
    setShowUpload(false);
  };

  const addToTimeline = (imageData: any) => {
    const imageItem: IImage = {
      id: imageData.id,
      type: "image",
      name: imageData.name || imageData.filename,
      preview: imageData.preview || imageData.url,
      duration: 5000, // Default duration for images
      display: {
        from: 0,
        to: 5000
      },
      details: {
        src: imageData.src || imageData.url,
        width: imageData.width || 1920,
        height: imageData.height || 1080
      },
      metadata: imageData.metadata || {}
    };

    console.log("Adding image to timeline:", imageItem);
    dispatch(ADD_ITEMS, { 
      payload: [imageItem], 
      options: { resourceId: "main" } 
    });
  };

  const handleUploadedImageSelect = (file: UploadedFile) => {
    addToTimeline({
      id: file.id,
      filename: file.filename,
      url: file.url,
      metadata: { filename: file.filename }
    });
  };

  const handleStaticImageSelect = (item: Partial<IImage>) => {
    if (item.id && item.name && item.preview) {
      addToTimeline({
        id: item.id,
        name: item.name,
        preview: item.preview,
        src: item.preview,
        width: item.width,
        height: item.height,
        metadata: item.metadata
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await fileUploadService.deleteFile(imageId);
      setUploadedImages(prev => prev.filter(image => image.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handlePreviewImage = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  // Filter images based on search
  const filteredStaticImages = library.filter(image => 
    image.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );
  
  const filteredUploadedImages = uploadedImages.filter(image =>
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalImages = filteredStaticImages.length + filteredUploadedImages.length;

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Image Library</h2>
            <p className="text-sm text-gray-500">{totalImages} images available</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 bg-white border-b border-gray-200">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>
      )}

      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {/* Uploaded Images Section */}
          {(filteredUploadedImages.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Your Images</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredUploadedImages.length}
                </Badge>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : filteredUploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredUploadedImages.map((image) => (
                    <Draggable
                      key={image.id}
                      data={() => ({
                        type: "image",
                        id: image.id,
                        name: image.filename,
                        preview: image.url,
                        duration: 5000,
                        display: { from: 0, to: 5000 },
                        details: {
                          src: image.url,
                          width: 1920,
                          height: 1080
                        },
                        metadata: { filename: image.filename }
                      })}
                    >
                      <MediaCard
                        id={image.id}
                        type="image"
                        title={image.filename}
                        url={image.url}
                        size={image.size}
                        onSelect={() => handleUploadedImageSelect(image)}
                        onDelete={() => handleDeleteImage(image.id)}
                        onPreview={() => handlePreviewImage(image.url)}
                      />
                    </Draggable>
                  ))}
                </div>
              ) : !searchTerm ? (
                <div className="text-center py-8">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No uploaded images yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowUpload(true)}
                  >
                    Upload Your First Image
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Static Images Section */}
          {(filteredStaticImages.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Stock Images</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredStaticImages.length}
                </Badge>
              </div>
              
              {filteredStaticImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredStaticImages.map((image, index) => (
                    <Draggable
                      key={image.id || index}
                      data={() => ({
                        ...image,
                        type: "image",
                        duration: 5000,
                        display: {
                          from: 0,
                          to: 5000
                        }
                      })}
                    >
                      <div
                        onClick={() => handleStaticImageSelect(image)}
                        className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:border-gray-300 hover:-translate-y-1"
                      >
                        <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-xl">
                          <img 
                            src={image.preview} 
                            alt={image.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 rounded-full p-2">
                              <Eye className="h-6 w-6 text-gray-800" />
                            </div>
                          </div>

                          <div className="absolute top-2 left-2 bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                            <ImageIcon className="h-3 w-3" />
                            IMAGE
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="font-medium text-sm text-gray-900 truncate" title={image.name}>
                            {image.name}
                          </h3>
                          {image.width && image.height && (
                            <p className="text-xs text-gray-500 mt-1">
                              {image.width} × {image.height}
                            </p>
                          )}
                        </div>
                      </div>
                    </Draggable>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No stock images match your search</p>
                </div>
              ) : null}
            </div>
          )}

          {/* No results state */}
          {totalImages === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-500 mb-4">
                No images match your search term "{searchTerm}".
              </p>
              <Button 
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
