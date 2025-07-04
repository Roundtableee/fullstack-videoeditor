"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_FORMATS = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
};

export default function CreateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFile = acceptedFiles[0];
    if (videoFile.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 100MB limit");
      return;
    }
    setFile(videoFile);
    setPreview(URL.createObjectURL(videoFile));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      toast.success("Video uploaded successfully!");
      setFile(null);
      setPreview("");
      setFormData({ title: "", description: "" });
    }, 5000);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create a Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-black bg-gray-50" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          {!file ? (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  Drag & drop your video here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: MP4, MOV, AVI (max 100MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                src={preview}
                className="w-full rounded-lg"
                controls
                preload="metadata"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview("");
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter video title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter video description"
              rows={4}
            />
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            {/* <Progress value={progress} /> */}
            <p className="text-sm text-gray-500 text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
      </form>
    </div>
  );
}