import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RenderJobData } from '../types';

export interface RenderResult {
  outputPath: string;
  url: string;
}

export const renderVideo = async (job: RenderJobData): Promise<RenderResult> => {
  const outputDir = process.env.OUTPUT_DIR || './outputs';
  const outputFileName = `${job.id}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);

  try {
    // Create Remotion composition based on job data
    const compositionData = createCompositionFromJob(job);
    
    // For now, we'll use a simple implementation that creates a basic video
    // In a real implementation, you would create a proper Remotion composition
    await createBasicVideo(job, outputPath);
    
    // Return the result
    const url = `/outputs/${outputFileName}`;
    return { outputPath, url };
    
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
};

const createCompositionFromJob = (job: RenderJobData) => {
  return {
    id: job.id,
    trackItems: job.design.trackItems,
    transitions: job.design.transitions,
    options: job.options
  };
};

// Create video with actual track items content
// ✅ GITHUB COPILOT GUIDELINE:
// - NEVER hardcode dimensions like 450:450, 1920x1080
// - ALWAYS use payload.width, payload.height, payload.aspectRatio
// - Use template literals ${variable} for dynamic FFmpeg filters
// - Preserve original aspect ratio with elementAspectRatio from payload
// - Choose force_original_aspect_ratio based on AR comparison (disable/decrease)
const createBasicVideo = async (job: RenderJobData, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegStatic = require('ffmpeg-static');
    
    // Set FFmpeg path
    ffmpeg.setFfmpegPath(ffmpegStatic);
    
    console.log('Creating video with track items:', job.design.trackItems);
    console.log('=== DETAILED TRACK ANALYSIS ===');
    job.design.trackItems.forEach((item, index) => {
      console.log(`Track ${index}:`, {
        type: item.type,
        src: item.details?.src,
        display: item.display,
        duration: (item as any).duration,
        metadata: (item as any).metadata
      });
    });
    console.log('================================');
    
    const duration = calculateTotalDuration(job.design.trackItems);
    
    // ✅ EXTRACT DYNAMIC VALUES FROM PAYLOAD - NO HARDCODED DIMENSIONS
    const { width, height } = job.options?.size;
    const canvasWidth = job.options?.width || width;
    const canvasHeight = job.options?.height || height;
    const aspectRatio = job.options?.aspectRatio || (canvasWidth / canvasHeight);
    const aspectRatioString = job.options?.aspectRatioString || `${canvasWidth}:${canvasHeight}`;
    
    if (!canvasWidth || !canvasHeight) {
      throw new Error('Canvas dimensions (width/height) are required from frontend payload');
    }
    
    console.log('🎯 DYNAMIC CANVAS FROM PAYLOAD:', {
      width: canvasWidth,
      height: canvasHeight,
      aspectRatio,
      aspectRatioString,
      originalSize: { width, height }
    });
    
    // Check if we have any track items with actual content
    const videoTracks = job.design.trackItems.filter(item => 
      item.type === 'video' && item.details?.src
    );
    const audioTracks = job.design.trackItems.filter(item => 
      item.type === 'audio' && item.details?.src
    );
    const imageTracks = job.design.trackItems.filter(item => 
      item.type === 'image' && item.details?.src
    );
    const textTracks = job.design.trackItems.filter(item => 
      item.type === 'text' && item.details?.text
    );
    
    console.log('Track summary:', {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      imageTracks: imageTracks.length,
      textTracks: textTracks.length,
      totalDuration: duration
    });
    
    let command = ffmpeg();
    let complexFilterString = ''; // Use a single string for the filter graph
    let outputVideoLabel = '0:v'; // Default video output
    let outputAudioLabel = '0:a'; // Default audio output
    let validVideoTracks: any[] = [];
    let hasVideoAudio = false; // To track if the video stream has audio

    // If we have video tracks, handle videos and images together
    if (videoTracks.length > 0) {
      console.log(`Processing ${videoTracks.length} video tracks and ${imageTracks.length} image tracks...`);
      
      // Sort video tracks by display.from to ensure correct order
      const sortedVideoTracks = [...videoTracks].sort((a, b) => {
        const fromA = a.display?.from || 0;
        const fromB = b.display?.from || 0;
        return fromA - fromB;
      });
      
      console.log('Video tracks sorted by display.from:');
      sortedVideoTracks.forEach((video, index) => {
        console.log(`  ${index}: from=${video.display?.from}, to=${video.display?.to}, src=${video.details?.src}`);
      });
      
      // Validate all video files exist first
      for (const video of sortedVideoTracks) {
        const videoSrc = resolveMediaPath(video.details?.src || '');
        if (checkFileExists(videoSrc)) {
          validVideoTracks.push({ ...video, resolvedSrc: videoSrc });
          console.log(`✓ Valid video file: ${videoSrc}`);
        } else {
          console.warn(`✗ Missing video file: ${videoSrc}`);
        }
      }
      
      if (validVideoTracks.length === 0) {
        throw new Error('No valid video files found');
      }
      
      // Always process image overlays if any images exist
      let overlayImageTracks: any[] = [];
      if (imageTracks.length > 0) {
        console.log(`Checking ${imageTracks.length} image tracks for overlays...`);
        const sortedImageTracks = [...imageTracks].sort((a, b) => {
          const fromA = a.display?.from || 0;
          const fromB = b.display?.from || 0;
          return fromA - fromB;
        });
        for (const image of sortedImageTracks) {
          const imageSrc = resolveMediaPath(image.details?.src || '');
          if (checkFileExists(imageSrc)) {
            overlayImageTracks.push({ ...image, resolvedSrc: imageSrc });
            console.log(`✓ Valid image file for overlay: ${imageSrc}`);
          } else {
            console.warn(`✗ Missing image file: ${imageSrc}`);
          }
        }
      }
      
      if (validVideoTracks.length === 1 && overlayImageTracks.length === 0 && textTracks.length === 0) {
        // Single video only WITHOUT text overlays - simple case
        const mainVideo = validVideoTracks[0];
        const clipDuration = (mainVideo.display.to - mainVideo.display.from) / 1000;
        const videoStartTime = mainVideo.display.from / 1000;
        
        console.log('Using single video only (no images, no text):', mainVideo.resolvedSrc);
        
        command = command.input(mainVideo.resolvedSrc);
        
        // For a single video, it should always fill the canvas.
        // ✅ USE DYNAMIC CANVAS SIZE FROM PAYLOAD - NO HARDCODED VALUES
        const videoWidth = canvasWidth % 2 === 0 ? canvasWidth : canvasWidth + 1;
        const videoHeight = canvasHeight % 2 === 0 ? canvasHeight : canvasHeight + 1;
        
        console.log(`✅ Single video using dynamic canvas: ${videoWidth}x${videoHeight} (AR: ${aspectRatio})`);

        // ✅ Scale video using payload dimensions - template literals
        command = command.videoFilters([
          `scale=w='min(iw,${videoWidth})':h='min(ih,${videoHeight})':force_original_aspect_ratio=decrease`,
          `pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:black`
        ]);
        
        outputVideoLabel = '0:v';
        hasVideoAudio = true; // Assume it has audio
        
      } else {
        // Single video + images OR multiple videos OR text overlays - use filter_complex
        console.log(`🎬 Complex filtering: ${validVideoTracks.length} videos + ${overlayImageTracks.length} images + ${textTracks.length} text overlays`);
        console.log('Using complex filter to ensure text overlays work properly');

        // Add all video inputs
        validVideoTracks.forEach((video) => {
          console.log(`Adding video input:`, video.resolvedSrc);
          command = command.input(video.resolvedSrc);
        });

        const filterChains: string[] = [];
        const audioStreamsToMix: string[] = [];

        // 1. Prepare each video and audio stream
        validVideoTracks.forEach((video, index) => {
          const clipDuration = (video.display.to - video.display.from) / 1000;
          const videoStartTime = video.display.from / 1000;

          console.log(`Video ${index}: start=${videoStartTime}s, duration=${clipDuration}s`);

          // Helper function to clean dimension values and ensure even numbers (H.264 requirement)
          const cleanDimension = (value: any, fallback: number): number => {
            let result;
            if (typeof value === 'string') {
              // Remove 'px' suffix and other units, extract number
              const numMatch = value.match(/\d+\.?\d*/);
              result = numMatch ? parseInt(numMatch[0]) : fallback;
            } else if (typeof value === 'number') {
              result = Math.round(value);
            } else {
              result = fallback;
            }
            
            // Ensure the dimension is even (required for H.264)
            return result % 2 === 0 ? result : result + 1;
          };

          // ✅ CONSISTENT VIDEO SIZE: Use frontend provided dimensions (dynamic values)
          let videoWidth, videoHeight;
          
          if (video.details?.dynamicWidth && video.details?.dynamicHeight) {
            // ✅ Use dynamic dimensions from payload - NO HARDCODED VALUES
            videoWidth = cleanDimension(video.details.dynamicWidth, Math.floor(canvasWidth / 3));
            videoHeight = cleanDimension(video.details.dynamicHeight, Math.floor(canvasHeight / 3));
            console.log(`✅ Video ${index}: using dynamic payload size ${videoWidth}x${videoHeight} (AR: ${video.details.elementAspectRatio || 'auto'})`);
          } else if (video.details?.width && video.details?.height) {
            // Fallback to legacy width/height
            videoWidth = cleanDimension(video.details.width, Math.floor(canvasWidth / 3));
            videoHeight = cleanDimension(video.details.height, Math.floor(canvasHeight / 3));
            console.log(`📐 Video ${index}: using legacy size ${videoWidth}x${videoHeight}`);
          } else {
            // ✅ Fallback using dynamic canvas dimensions
            videoWidth = cleanDimension(Math.floor(canvasWidth / 3), Math.floor(canvasWidth / 3));
            videoHeight = cleanDimension(Math.floor(canvasHeight / 3), Math.floor(canvasHeight / 3));
            console.log(`⚠️ Video ${index}: using calculated fallback ${videoWidth}x${videoHeight} from canvas ${canvasWidth}x${canvasHeight}`);
          }
          // Clean and normalize position values
          const cleanPosition = (pos: any): number => {
            if (typeof pos === 'string') {
              const numMatch = pos.match(/-?\d+\.?\d*/);
              return numMatch ? parseFloat(numMatch[0]) : 0;
            } else if (typeof pos === 'number') {
              return pos;
            }
            return 0;
          };
          let xVid = cleanPosition(video.display?.position?.x ?? 0);
          let yVid = cleanPosition(video.display?.position?.y ?? 0);
          console.log(`[DEBUG] Video input: index=${index}, x=${xVid}, y=${yVid}, size=${videoWidth}x${videoHeight}`);

          // Note: Video dimensions are calculated above based on frontend provided values
          console.log(`Video ${index}: final size=${videoWidth}x${videoHeight}`);

          // Trim, scale, pad, and set PTS for video - ใช้ scale ที่ไม่ขยายขึ้น
          const videoChain = 
            `[${index}:v]trim=start=0:duration=${clipDuration},` +
            `scale=w='min(iw,${videoWidth})':h='min(ih,${videoHeight})':force_original_aspect_ratio=decrease,` +
            `pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:black,` +
            `setsar=1,` +
            `setpts=PTS-STARTPTS+${videoStartTime}/TB[v${index}]`;
          filterChains.push(videoChain);

          // Add audio from ALL videos that have audio streams
          // Use adelay filter for proper audio delay (in milliseconds)
          const audioDelayMs = Math.round(videoStartTime * 1000);
          const audioChain = `[${index}:a]atrim=start=0:duration=${clipDuration},adelay=${audioDelayMs}|${audioDelayMs}[a${index}]`;
          filterChains.push(audioChain);
          audioStreamsToMix.push(`[a${index}]`);
          console.log(`Added audio stream from video ${index} with ${audioDelayMs}ms delay`);
        });

        // 2. Create a base canvas to overlay videos onto with even dimensions
        const totalDurationSec = duration / 1000;
        // ✅ USE DYNAMIC CANVAS DIMENSIONS FROM PAYLOAD
        const finalCanvasWidth = canvasWidth % 2 === 0 ? canvasWidth : canvasWidth + 1;
        const finalCanvasHeight = canvasHeight % 2 === 0 ? canvasHeight : canvasHeight + 1;
        const baseCanvas = `color=c=black:s=${finalCanvasWidth}x${finalCanvasHeight}:d=${totalDurationSec}[base]`;
        filterChains.unshift(baseCanvas); // Add to the beginning of the filter chains
        
        console.log(`✅ Base canvas created: ${finalCanvasWidth}x${finalCanvasHeight} (AR: ${aspectRatio}) from payload`);

        // 3. Chain the overlay filters
        let lastOverlayOutput = '[base]';
        validVideoTracks.forEach((video, index) => {
          const nextOverlayInput = `[v${index}]`;
          const newOverlayOutput = index === validVideoTracks.length - 1 ? '[final]' : `[ov${index}]`;
          
          // ✅ CONSISTENT POSITION PROCESSING: Use cleanPosition like image processing
          const cleanPosition = (pos: any): number => {
            if (typeof pos === 'string') {
              const numMatch = pos.match(/-?\d+\.?\d*/);
              return numMatch ? parseFloat(numMatch[0]) : 0;
            } else if (typeof pos === 'number') {
              return pos;
            }
            return 0;
          };

          // Get position from display object using cleanPosition immediately
          let xVid = cleanPosition(video.display?.position?.x ?? 0);
          let yVid = cleanPosition(video.display?.position?.y ?? 0);
          
          // Handle scale factor if provided
          const scale = video.details?.scale || 1;
          
          // Determine if this is the main background video or an overlay
          const isMainVideo = index === 0 && (!video.display?.position || 
            (video.display.position.x === 0 && video.display.position.y === 0));
          
          if (isMainVideo) {
            // Main video should fill the canvas, position at (0,0)
            xVid = 0;
            yVid = 0;
            console.log(`Main video ${index} positioned at origin: (${xVid}, ${yVid})`);
          } else {
            // Overlay video - keep the calculated position
            console.log(`Overlay video ${index} positioned at: (${xVid}, ${yVid})`);
          }
          
          // Apply scale to position if needed
          if (scale !== 1) {
            xVid = Math.round(xVid * scale);
            yVid = Math.round(yVid * scale);
          }
          
          // Ensure values are integers for FFmpeg
          xVid = Math.round(xVid);
          yVid = Math.round(yVid);
          
          const startTimeSec = video.display.from / 1000;
          const endTimeSec = video.display.to / 1000;

          console.log(`Video ${index}: overlay at x=${xVid}, y=${yVid} (scale=${scale}) from ${startTimeSec}s to ${endTimeSec}s`);

          const overlayFilter = `${lastOverlayOutput} ${nextOverlayInput} overlay=x=${xVid}:y=${yVid}:enable='between(t,${startTimeSec},${endTimeSec})' ${newOverlayOutput}`;
          filterChains.push(overlayFilter);
          lastOverlayOutput = newOverlayOutput;
        });
        
        // 4. Add image overlays on top of video layers if any images exist
        if (overlayImageTracks.length > 0) {
          console.log(`Adding ${overlayImageTracks.length} image overlays to video composition...`);
          
          // Image tracks are already sorted and validated in overlayImageTracks
          if (overlayImageTracks.length > 0) {
            // Add image inputs with proper frame rate and duration
            const totalDurationSec = duration / 1000;
            let imageInputIndex = validVideoTracks.length; // Start after video inputs
            
            overlayImageTracks.forEach((image, index) => {
              console.log(`Adding image input ${imageInputIndex}:`, image.resolvedSrc);
              
              // Use proper FFmpeg options for image-to-video conversion
              command = command.input(image.resolvedSrc)
                .inputOptions([
                  '-loop', '1',                              // Loop the image
                  '-t', `${totalDurationSec}`,              // Total duration
                  '-framerate', `${job.options.fps || 30}`, // Set frame rate
                  '-pix_fmt', 'yuv420p'                     // Ensure proper pixel format
                ]);
              imageInputIndex++;
            });
            
            // Helper function to ensure even dimensions for images
            const cleanImageDimension = (value: any, fallback: number): number => {
              let result;
              if (typeof value === 'string') {
                const numMatch = value.match(/\d+\.?\d*/);
                result = numMatch ? parseInt(numMatch[0]) : fallback;
              } else if (typeof value === 'number') {
                result = Math.round(value);
              } else {
                result = fallback;
              }
              
              // Ensure the dimension is even (required for H.264)
              return result % 2 === 0 ? result : result + 1;
            };
            
            // Helper for position
            const cleanPosition = (pos: any): number => {
              if (typeof pos === 'string') {
                const numMatch = pos.match(/-?\d+\.?\d*/);
                return numMatch ? parseFloat(numMatch[0]) : 0;
              } else if (typeof pos === 'number') {
                return pos;
              }
              return 0;
            };
            
            // Create filter chains for each image overlay
            overlayImageTracks.forEach((image, index) => {
              const imageIndex = validVideoTracks.length + index;
              const imageStartTime = image.display.from / 1000;
              const imageEndTime = image.display.to / 1000;
              
              console.log(`Image ${index}: start=${imageStartTime}s, end=${imageEndTime}s`);
              
              // ✅ CONSISTENT IMAGE SIZE: Use dynamic dimensions from payload
              let imageWidth, imageHeight;
              
              // ✅ CRITICAL DEBUG: แสดงข้อมูลที่ได้รับจาก frontend
              console.log(`🔍 BACKEND RECEIVED for image ${index}:`, {
                dynamicWidth: image.details?.dynamicWidth,
                dynamicHeight: image.details?.dynamicHeight,
                width: image.details?.width,
                height: image.details?.height,
                scaledWidth: image.details?.scaledWidth,
                scaledHeight: image.details?.scaledHeight,
                elementAspectRatio: image.details?.elementAspectRatio,
                originalAspectRatio: image.details?.originalAspectRatio
              });
              
              if (image.details?.dynamicWidth && image.details?.dynamicHeight) {
                // ✅ Use dynamic dimensions from payload - NO HARDCODED VALUES
                imageWidth = cleanImageDimension(image.details.dynamicWidth, 300);
                imageHeight = cleanImageDimension(image.details.dynamicHeight, 200);
                console.log(`✅ Image ${index}: using dynamic payload size ${imageWidth}x${imageHeight} (AR: ${image.details.elementAspectRatio || 'auto'})`);
              } else if (image.details?.scaledWidth && image.details?.scaledHeight) {
                // ✅ Use scaled dimensions (post-crop size) as backup
                imageWidth = cleanImageDimension(image.details.scaledWidth, 300);
                imageHeight = cleanImageDimension(image.details.scaledHeight, 200);
                console.log(`✅ Image ${index}: using scaled size (post-crop) ${imageWidth}x${imageHeight}`);
              } else if (image.details?.width && image.details?.height) {
                // Fallback to legacy width/height
                imageWidth = cleanImageDimension(image.details.width, 300);
                imageHeight = cleanImageDimension(image.details.height, 200);
                console.log(`📐 Image ${index}: using legacy size ${imageWidth}x${imageHeight}`);
              } else {
                // ✅ Fallback to calculated size from canvas
                imageWidth = cleanImageDimension(300, 300);
                imageHeight = cleanImageDimension(200, 200);
                console.log(`⚠️ Image ${index}: using fallback size ${imageWidth}x${imageHeight}`);
              }
              
              // Get clean position values
              const xImg = cleanPosition(image.display?.position?.x ?? 0);
              const yImg = cleanPosition(image.display?.position?.y ?? 0);
              
              console.log(`[DEBUG] Image ${index}: position=(${xImg},${yImg}), size=${imageWidth}x${imageHeight}`);
              
              // Create image processing filter chain with crop support
              let imageFilterChain = `[${imageIndex}:v]`;
              
              // ✅ IMPROVED CROP HANDLING: Better validation and error handling
              if (image.details?.crop) {
                const crop = image.details.crop;
                // Ensure crop values are within reasonable bounds
                const cropX = Math.max(0, Math.round(crop.x || 0));
                const cropY = Math.max(0, Math.round(crop.y || 0));
                const cropW = Math.max(1, Math.round(crop.width || 100));
                const cropH = Math.max(1, Math.round(crop.height || 100));
                
                imageFilterChain += `crop=${cropW}:${cropH}:${cropX}:${cropY},`;
                console.log(`Image ${index}: applying crop=${cropW}:${cropH}:${cropX}:${cropY}`);
              } else {
                console.log(`Image ${index}: no crop data, using original image`);
              }
              
              // ✅ PRESERVE IMAGE ASPECT RATIO: Use decrease to maintain original proportions
              // Get element aspect ratio from payload or calculate from dimensions
              const elementAR = image.details?.elementAspectRatio || (imageWidth / imageHeight);
              const targetAR = imageWidth / imageHeight;
              
              // Choose scaling strategy based on aspect ratio preservation
              const scaleStrategy = Math.abs(elementAR - targetAR) < 0.01 ? 'disable' : 'decrease';
              
              imageFilterChain += 
                `scale=${imageWidth}:${imageHeight}:force_original_aspect_ratio=${scaleStrategy}` +
                `,pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:black` +
                `,fps=${job.options.fps || 30}` +
                `,format=yuv420p` +
                `,setsar=1[img_${index}]`;
              
              console.log(`✅ Image ${index} FFmpeg filter: scale=${imageWidth}:${imageHeight}:${scaleStrategy} (AR: ${elementAR.toFixed(3)} -> ${targetAR.toFixed(3)})`);
              
              filterChains.push(imageFilterChain);
              
              // Create overlay filter with proper timing control
              const overlayLabel = `[img_${index}]`;
              const outputLabel = index === overlayImageTracks.length - 1 ? '[final_mixed]' : `[tmp_${index}]`;
              
              // Use proper overlay syntax with timing
              const overlayFilter = `${lastOverlayOutput}${overlayLabel}overlay=x=${xImg}:y=${yImg}:enable='between(t,${imageStartTime},${imageEndTime})'${outputLabel}`;
              
              filterChains.push(overlayFilter);
              lastOverlayOutput = outputLabel;
            });
            
            outputVideoLabel = lastOverlayOutput; // Update final output label
          }
        }
        
        outputVideoLabel = lastOverlayOutput; // The final video is the result of the last overlay

        // 5. Handle audio for multiple videos - mix all audio streams
        if (audioStreamsToMix.length > 1) {
          // Mix multiple audio streams
          const amixInputs = audioStreamsToMix.join('');
          const amixFilter = `${amixInputs}amix=inputs=${audioStreamsToMix.length}:duration=longest[mixedaudio]`;
          filterChains.push(amixFilter);
          outputAudioLabel = '[mixedaudio]';
          hasVideoAudio = true;
          console.log(`Mixing ${audioStreamsToMix.length} audio streams:`, audioStreamsToMix);
        } else if (audioStreamsToMix.length === 1) {
          // Single audio stream
          outputAudioLabel = audioStreamsToMix[0];
          hasVideoAudio = true;
          console.log('Using single audio stream:', outputAudioLabel);
        } else {
          hasVideoAudio = false;
          console.log('No audio streams available');
        }

        // Join all filter chains for the final complex filter string (use semicolon separator)
        complexFilterString = filterChains.join(';');
        
        // 6. Add text overlays if any exist
        if (textTracks.length > 0) {
          console.log(`📝 Adding ${textTracks.length} text overlays...`);
          console.log(`📍 Text base label: ${outputVideoLabel}`);
          const textFilters = createTextFilters(textTracks, outputVideoLabel, job.options.fps || 30, width, height);
          console.log(`🔤 Generated ${textFilters.length} text filters:`);
          textFilters.forEach((filter, idx) => {
            console.log(`  Text Filter ${idx}: ${filter}`);
          });
          
          if (textFilters.length > 0) {
            complexFilterString += ';' + textFilters.join(';');
            outputVideoLabel = '[final_with_text]'; // Update final output label
            console.log(`✅ Text filters added. New output label: ${outputVideoLabel}`);
          } else {
            console.log('⚠️ No text filters were generated!');
          }
        }
      }
      
    } else if (imageTracks.length > 0 || textTracks.length > 0) {
      // Handle image tracks and/or text tracks (when no video tracks exist)
      console.log(`Processing ${imageTracks.length} image tracks and ${textTracks.length} text tracks...`);

      // Sort image tracks by display.from to ensure correct order
      const sortedImageTracks = [...imageTracks].sort((a, b) => {
        const fromA = a.display?.from || 0;
        const fromB = b.display?.from || 0;
        return fromA - fromB;
      });
      
      console.log('Image tracks sorted by display.from:');
      sortedImageTracks.forEach((image, index) => {
        console.log(`  ${index}: from=${image.display?.from}, to=${image.display?.to}, src=${image.details?.src}`);
      });

      // Validate all image files exist first
      let soloImageTracks: any[] = [];
      for (const image of sortedImageTracks) {
        const imageSrc = resolveMediaPath(image.details?.src || '');
        if (checkFileExists(imageSrc)) {
          soloImageTracks.push({ ...image, resolvedSrc: imageSrc });
          console.log(`✓ Valid image file: ${imageSrc}`);
        } else {
          console.warn(`✗ Missing image file: ${imageSrc}`);
        }
      }
      
      if (soloImageTracks.length === 0) {
        throw new Error('No valid image files found');
      }

      if (soloImageTracks.length === 1) {
        // Single image - simple case
        const mainImage = soloImageTracks[0];
        const imageSrc = mainImage.resolvedSrc;
        const imageDuration = (mainImage.display.to - mainImage.display.from) / 1000;
        
        console.log('✓ Using single image:', imageSrc);
        console.log(`Image duration: ${imageDuration}s`);
        
        command = command.input(imageSrc)
          .inputOptions([
            '-loop', '1', 
            '-t', `${imageDuration}`,
            '-framerate', `${job.options.fps || 30}`
          ]);

        const filterChains: string[] = [];
        
        // Handle image positioning and scaling
        const imagePosition = mainImage.display?.position;
        
        // ✅ USE DYNAMIC DIMENSIONS FROM PAYLOAD (หลังจาก crop/scale)
        let imageWidth, imageHeight;
        
        if (mainImage.details?.dynamicWidth && mainImage.details?.dynamicHeight) {
          // ✅ Use dynamic dimensions from payload - NO HARDCODED VALUES
          imageWidth = mainImage.details.dynamicWidth;
          imageHeight = mainImage.details.dynamicHeight;
          console.log(`✅ Solo image using dynamic payload size: ${imageWidth}x${imageHeight} (AR: ${mainImage.details.elementAspectRatio || 'auto'})`);
        } else if (mainImage.details?.scaledWidth && mainImage.details?.scaledHeight) {
          // ✅ Use scaled dimensions (post-crop size) as backup
          imageWidth = mainImage.details.scaledWidth;
          imageHeight = mainImage.details.scaledHeight;
          console.log(`✅ Solo image using scaled size (post-crop): ${imageWidth}x${imageHeight}`);
        } else {
          // Fallback to legacy approach with payload canvas dimensions
          imageWidth = mainImage.details?.scaledWidth || mainImage.details?.width || canvasWidth;
          imageHeight = mainImage.details?.scaledHeight || mainImage.details?.height || canvasHeight;
          console.log(`📐 Solo image using legacy/canvas size: ${imageWidth}x${imageHeight}`);
        }
        
        // Clean dimension values and ensure even numbers for H.264 compatibility
        const cleanDimension = (value: any, fallback: number): number => {
          let result;
          if (typeof value === 'string') {
            const numMatch = value.match(/\d+\.?\d*/);
            result = numMatch ? parseInt(numMatch[0]) : fallback;
          } else if (typeof value === 'number') {
            result = Math.round(value);
          } else {
            result = fallback;
          }
          
          // Ensure the dimension is even (required for H.264)
          return result % 2 === 0 ? result : result + 1;
        };
        
        imageWidth = cleanDimension(imageWidth, canvasWidth);
        imageHeight = cleanDimension(imageHeight, canvasHeight);
        
        // ✅ Ensure final canvas dimensions use payload values
        const finalCanvasWidth = canvasWidth % 2 === 0 ? canvasWidth : canvasWidth + 1;
        const finalCanvasHeight = canvasHeight % 2 === 0 ? canvasHeight : canvasHeight + 1;
        
        // Determine if image has explicit dimensions - รวม scaledWidth ด้วย (ขนาดหลังจาก crop)
        const hasExplicitDims = (!!mainImage.details?.dynamicWidth || !!mainImage.details?.scaledWidth);
        let imageFilter;
        if (hasExplicitDims) {
          // ✅ PRESERVE ASPECT RATIO for positioned/sized images
          const elementAR = mainImage.details?.elementAspectRatio || (imageWidth / imageHeight);
          const targetAR = imageWidth / imageHeight;
          const scaleStrategy = Math.abs(elementAR - targetAR) < 0.01 ? 'disable' : 'decrease';
          
          imageFilter = [
            `scale=${imageWidth}:${imageHeight}:force_original_aspect_ratio=${scaleStrategy}`,
            `pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:black`,
            `fps=${job.options.fps || 30}`,
            `format=yuv420p`,
            `setsar=1`
          ];
          console.log(`✅ Solo image positioned: ${imageWidth}x${imageHeight}:${scaleStrategy} (AR: ${elementAR.toFixed(3)} -> ${targetAR.toFixed(3)})`);
        } else {
          // No explicit size - treat as full canvas image
          imageFilter = [
            `scale=${finalCanvasWidth}:${finalCanvasHeight}:force_original_aspect_ratio=decrease`,
            `pad=${finalCanvasWidth}:${finalCanvasHeight}:(ow-iw)/2:(oh-ih)/2:black`,
            `fps=${job.options.fps || 30}`,
            `format=yuv420p`,
            `setsar=1`
          ];
        }
        
        // Check if we have text overlays - if so, use complex filter
        if (textTracks.length > 0) {
          // Use complex filter to handle text overlays
          filterChains.push(`[0:v]${imageFilter.join(',')}[img0]`);
          outputVideoLabel = 'img0';
        } else {
          // No text overlays - use simple filter
          command = command.videoFilters(imageFilter);
          outputVideoLabel = '0:v';
        }
        hasVideoAudio = false;

      } else {
        // Multiple images - create overlay system
        console.log(`Overlaying ${soloImageTracks.length} images...`);

        // Add all image inputs with proper frame rate and duration
        const imageDurationSec = duration / 1000;
        soloImageTracks.forEach((image) => {
          console.log(`Adding image input:`, image.resolvedSrc);
          command = command.input(image.resolvedSrc)
            .inputOptions([
              '-loop', '1',
              '-t', `${imageDurationSec}`,
              '-framerate', `${job.options.fps || 30}`
            ]);
        });

        const filterChains: string[] = [];

        // Helper function to clean dimension values and ensure even numbers
        const cleanDimension = (value: any, fallback: number): number => {
          let result;
          if (typeof value === 'string') {
            const numMatch = value.match(/\d+\.?\d*/);
            result = numMatch ? parseInt(numMatch[0]) : fallback;
          } else if (typeof value === 'number') {
            result = Math.round(value);
          } else {
            result = fallback;
          }
          
          // Ensure the dimension is even (required for H.264)
          return result % 2 === 0 ? result : result + 1;
        };

        // ✅ 1. Create a base canvas using dynamic dimensions from payload
        const multiImageDurationSec = duration / 1000;
        const finalCanvasWidth = canvasWidth % 2 === 0 ? canvasWidth : canvasWidth + 1;
        const finalCanvasHeight = canvasHeight % 2 === 0 ? canvasHeight : canvasHeight + 1;
        const baseCanvas = `color=c=black:s=${finalCanvasWidth}x${finalCanvasHeight}:d=${multiImageDurationSec}:r=${job.options.fps || 30}[base]`;
        filterChains.push(baseCanvas);
        
        console.log(`✅ Multi-image base canvas: ${finalCanvasWidth}x${finalCanvasHeight} (AR: ${aspectRatio}) from payload`);

        // 2. Prepare each image stream with proper frame rate
        soloImageTracks.forEach((image, index) => {
          const imageDuration = (image.display.to - image.display.from) / 1000;
          const imageStartTime = image.display.from / 1000;

          console.log(`Image ${index}: start=${imageStartTime}s, duration=${imageDuration}s`);

          // ✅ Get image dimensions using dynamic values from payload (หลังจาก crop/scale)
          let imageWidth, imageHeight;
          
          if (image.details?.dynamicWidth && image.details?.dynamicHeight) {
            // ✅ Use dynamic dimensions from payload - NO HARDCODED VALUES
            imageWidth = cleanDimension(image.details.dynamicWidth, canvasWidth);
            imageHeight = cleanDimension(image.details.dynamicHeight, canvasHeight);
            console.log(`✅ Multi-image ${index}: using dynamic payload size ${imageWidth}x${imageHeight}`);
          } else if (image.details?.scaledWidth && image.details?.scaledHeight) {
            // ✅ Use scaled dimensions (post-crop size) as backup
            imageWidth = cleanDimension(image.details.scaledWidth, canvasWidth);
            imageHeight = cleanDimension(image.details.scaledHeight, canvasHeight);
            console.log(`✅ Multi-image ${index}: using scaled size (post-crop) ${imageWidth}x${imageHeight}`);
          } else {
            // Fallback to legacy approach
            imageWidth = cleanDimension(image.details?.scaledWidth || image.details?.width, canvasWidth);
            imageHeight = cleanDimension(image.details?.scaledHeight || image.details?.height, canvasHeight);
            console.log(`📐 Multi-image ${index} using legacy size: ${imageWidth}x${imageHeight}`);
          }
          
          // Check if image has position data
          const hasPosition = image.display?.position && 
            (image.display.position.x !== 0 || image.display.position.y !== 0);
          
          // For positioned images, validate dimensions
          if (hasPosition) {
            // Use calculated dimensions above (already handles dynamic vs legacy)
            console.log(`📍 Positioned image ${index}: ${imageWidth}x${imageHeight} at ${JSON.stringify(image.display?.position)}`);
          } else {
            // Main image uses full canvas size from payload
            imageWidth = canvasWidth;
            imageHeight = canvasHeight;
            console.log(`🎯 Main image ${index}: using full canvas ${imageWidth}x${imageHeight}`);
          }

          console.log(`Image ${index}: size=${imageWidth}x${imageHeight}, positioned=${hasPosition}, position=${JSON.stringify(image.display?.position)}`);

          // Build image filter chain with crop support
          let imageFilterChain = `[${index}:v]`;
          
          // Add crop filter if crop data exists
          if (image.details?.crop) {
            const crop = image.details.crop;
            const cropX = Math.max(0, crop.x);
            const cropY = Math.max(0, crop.y);
            const cropW = Math.max(1, crop.width);
            const cropH = Math.max(1, crop.height);
            imageFilterChain += ` crop=${cropW}:${cropH}:${cropX}:${cropY},`;
            console.log(`Adding crop filter to image ${index}: crop=${cropW}:${cropH}:${cropX}:${cropY}`);
          }
          
          // ✅ Continue with scale using ORIGINAL aspect ratio preservation
          const elementAR = image.details?.elementAspectRatio || (imageWidth / imageHeight);
          const targetAR = imageWidth / imageHeight;
          const scaleStrategy = Math.abs(elementAR - targetAR) < 0.01 ? 'disable' : 'decrease';
          
          imageFilterChain += 
            ` scale=${imageWidth}:${imageHeight}:force_original_aspect_ratio=${scaleStrategy}, ` +
            `pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:black, ` +
            `fps=${job.options.fps || 30}, ` +
            `format=yuv420p, ` +
            `setsar=1 [img${index}]`;
          filterChains.push(imageFilterChain);
          
          console.log(`✅ Multi-image ${index} FFmpeg filter: scale=${imageWidth}:${imageHeight}:${scaleStrategy} (AR: ${elementAR.toFixed(3)} -> ${targetAR.toFixed(3)})`);
        });

        // 3. Chain the overlay filters
        let lastOverlayOutput = '[base]';
        soloImageTracks.forEach((image, index) => {
          const nextOverlayInput = `[img${index}]`;
          const newOverlayOutput = index === soloImageTracks.length - 1 ? '[final]' : `[imgov${index}]`;
          
          // Get position from display object
          let x = 0;
          let y = 0;
          
          if (image.display?.position) {
            x = image.display.position.x || 0;
            y = image.display.position.y || 0;
          }
          
          // Handle scale factor if provided
          const scale = image.details?.scale || 1;
          
          // Clean and normalize position values
          const cleanPosition = (pos: any): number => {
            if (typeof pos === 'string') {
              const numMatch = pos.match(/-?\d+\.?\d*/);
              return numMatch ? parseFloat(numMatch[0]) : 0;
            } else if (typeof pos === 'number') {
              return pos;
            }
            return 0;
          };
          
          x = cleanPosition(x);
          y = cleanPosition(y);
          
          // Determine if this is the main background image or an overlay
          const isMainImage = index === 0 && (!image.display?.position || 
            (image.display.position.x === 0 && image.display.position.y === 0));
          
          if (isMainImage) {
            // Main image should fill the canvas, position at (0,0)
            x = 0;
            y = 0;
            console.log(`Main image ${index} positioned at origin: (${x}, ${y})`);
          } else {
            // Overlay image - keep the calculated position
            console.log(`Overlay image ${index} positioned at: (${x}, ${y})`);
          }
          
          // Apply scale to position if needed
          if (scale !== 1) {
            x = Math.round(x * scale);
            y = Math.round(y * scale);
          }
          
          // Ensure values are integers for FFmpeg
          x = Math.round(x);
          y = Math.round(y);
          
          const startTimeSec = image.display.from / 1000;
          const endTimeSec = image.display.to / 1000;

          console.log(`Image ${index}: overlay at x=${x}, y=${y} (scale=${scale}) from ${startTimeSec}s to ${endTimeSec}s`);

          // Fixed overlay filter with proper spacing and syntax
          const overlayFilter = `${lastOverlayOutput} ${nextOverlayInput} overlay=x=${x}:y=${y}:enable='between(t,${startTimeSec},${endTimeSec})' ${newOverlayOutput}`;
          filterChains.push(overlayFilter);
          lastOverlayOutput = newOverlayOutput;
        });
        
        outputVideoLabel = lastOverlayOutput;
        hasVideoAudio = false;

        // Join all filter chains for the final complex filter string
        complexFilterString = filterChains.join('; ');
        
        // Add text overlays if any exist
        if (textTracks.length > 0) {
          console.log(`Adding ${textTracks.length} text overlays to image composition...`);
          const textFilters = createTextFilters(textTracks, outputVideoLabel, job.options.fps || 30, width, height);
          if (textFilters.length > 0) {
            complexFilterString += '; ' + textFilters.join('; ');
            outputVideoLabel = '[final_with_text]'; // Update final output label
          }
        }
      }
      
    } else if (textTracks.length > 0) {
      // Handle text-only content (no video or images)
      console.log(`Processing ${textTracks.length} text tracks only...`);
      
      const totalDurationSec = duration / 1000;
      const canvasWidth = width % 2 === 0 ? width : width + 1;
      const canvasHeight = height % 2 === 0 ? height : height + 1;
      
      // Create base canvas for text
      const baseCanvas = `color=c=black:s=${canvasWidth}x${canvasHeight}:d=${totalDurationSec}[textbase]`;
      const filterChains = [baseCanvas];
      
      // Add text overlays
      const textFilters = createTextFilters(textTracks, '[textbase]', job.options.fps || 30, width, height);
      filterChains.push(...textFilters);
      
      complexFilterString = filterChains.join('; ');
      outputVideoLabel = '[final_with_text]';
      hasVideoAudio = false;
      
    } else {
      // Fallback: create blank video with even dimensions
      console.log('No video/image/text content found, creating blank video');
      const totalDurationSec = duration / 1000;
      const canvasWidth = width % 2 === 0 ? width : width + 1;
      const canvasHeight = height % 2 === 0 ? height : height + 1;
      
      command = command.input(`color=c=black:size=${canvasWidth}x${canvasHeight}:duration=${totalDurationSec}:rate=${job.options.fps || 30}`)
        .inputFormat('lavfi');
      outputVideoLabel = '0:v';
      hasVideoAudio = false;
    }
    
    // Add audio if available
    if (audioTracks.length > 0) {
      console.log('Processing audio tracks:', audioTracks.length);
      
      // Validate audio file exists
      const mainAudio = audioTracks[0];
      const audioSrc = resolveMediaPath(mainAudio.details?.src || '');
      
      if (checkFileExists(audioSrc)) {
        console.log('✓ Valid audio file:', audioSrc);
        const audioInputIndex = command.ffmpegProc.inputs.length; // Get the index for the new audio input
        command = command.input(audioSrc);
        
        if (hasVideoAudio) {
          // We have existing audio (from single or concatenated video), so mix it
          console.log(`Mixing existing audio with new audio input from index ${audioInputIndex}`);
          const amixFilter = `[${outputAudioLabel}][${audioInputIndex}:a]amix=inputs=2:duration=longest[finalaudio]`;
          
          // Append the amix filter to the existing complex filter string
          complexFilterString = complexFilterString ? `${complexFilterString};${amixFilter}` : amixFilter;
          
          outputAudioLabel = '[finalaudio]'; // The new final audio is the mixed one
        } else {
          // No existing audio, just use this new audio track
          console.log(`Using new audio input from index ${audioInputIndex}`);
          outputAudioLabel = `${audioInputIndex}:a`;
        }
      } else {
        console.warn('✗ Missing audio file, proceeding without it:', audioSrc);
      }
    }
    
    // Apply the final complex filter if it was built
    if (complexFilterString) {
      console.log('🎬 Final Complex Filter String:');
      console.log(complexFilterString);
      console.log(`📍 Output Video Label: ${outputVideoLabel}`);
      command = command.complexFilter(complexFilterString);
    } else {
      console.log('⚠️ No complex filter was built!');
    }

    // Set final output mappings - improved audio handling
    const outputOptions = [
      '-map', outputVideoLabel,
      '-c:v', 'libx264'
    ];

    // Add audio mapping if we have audio streams
    if (hasVideoAudio && outputAudioLabel) {
      if (outputAudioLabel.includes('[')) {
        // Complex filter output
        outputOptions.push('-map', outputAudioLabel);
        outputOptions.push('-c:a', 'aac');
        console.log('Audio stream added to output (complex filter):', outputAudioLabel);
      } else {
        // Direct stream mapping with optional flag
        outputOptions.push('-map', outputAudioLabel + '?');
        outputOptions.push('-c:a', 'aac');
        console.log('Audio stream added to output (direct):', outputAudioLabel + '?');
      }
    } else if (audioTracks.length > 0) {
      // External audio tracks
      outputOptions.push('-map', '0:a?');
      outputOptions.push('-c:a', 'aac');
      console.log('External audio stream added');
    } else {
      console.log('No audio stream available. Rendering video-only.');
    }
    
    // Always add shortest flag at the end
    outputOptions.push('-shortest');


    console.log('Final output options:', outputOptions);
    command = command.outputOptions(outputOptions);

    command
      .output(outputPath)
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-crf', `${job.options.crf || 18}`,
        '-preset', 'medium',
        '-r', `${job.options.fps || 30}`,
        '-t', `${duration / 1000}`, // Set duration to match timeline
        '-movflags', '+faststart' // For better streaming
      ])
      .on('start', (commandLine: string) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress: any) => {
        console.log(`Rendering progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on('stderr', (stderrLine: string) => {
        console.log('FFmpeg stderr:', stderrLine);
      })
      .on('end', () => {
        console.log('Video rendering completed');
        resolve();
      })
      .on('error', (err: any, stdout: string, stderr: string) => {
        console.error('FFmpeg error details:');
        console.error('Error:', err);
        console.error('Stdout:', stdout);
        console.error('Stderr:', stderr);
        console.error('Command that failed:', err.message);
        reject(new Error(`FFmpeg failed: ${err.message}\nStderr: ${stderr}`));
      });
    
    command.run();
  });
};

// Helper function to resolve media file paths with proper path handling for FFmpeg
const resolveMediaPath = (src: string): string => {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src; // External URL
  }
  
  if (src.startsWith('/uploads/')) {
    // Local upload - convert to absolute path
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, src.replace('/uploads/', ''));
    
    // Convert Windows backslashes to forward slashes for FFmpeg
    return filePath.replace(/\\/g, '/');
  }
  
  // Assume it's already a valid file path, convert backslashes to forward slashes
  return src.replace(/\\/g, '/');
};

// Helper function to check if file exists
const checkFileExists = (filePath: string): boolean => {
  try {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return true; // Can't check URLs easily, assume they exist
    }
    return fs.existsSync(filePath);
  } catch (err) {
    console.error('Error checking file:', filePath, err);
    return false;
  }
};

const calculateTotalDuration = (trackItems: any[]): number => {
  if (!trackItems || trackItems.length === 0) return 5000; // Default 5 seconds
  
  // Calculate based on the latest end time of all items on timeline
  // This gives us the total timeline duration, not sum of video durations
  const itemsWithTime = trackItems
    .filter(item => item.display?.from !== undefined && item.display?.to !== undefined);
  
  console.log('📊 Timeline analysis:');
  itemsWithTime.forEach((item, index) => {
    console.log(`  ${index}: ${item.type} from ${item.display.from}ms to ${item.display.to}ms (duration: ${item.display.to - item.display.from}ms)`);
  });
  
  if (itemsWithTime.length === 0) {
    return 5000; // Default if no valid items
  }
  
  // Find the maximum end time across all timeline items
  const maxEndTime = Math.max(...itemsWithTime.map(item => item.display.to));
  
  console.log(`📏 Total timeline duration: ${maxEndTime}ms`);
  return Math.max(maxEndTime, 1000); // Minimum 1 second
};

// Helper function to create text overlay filters
const createTextFilters = (textTracks: any[], inputLabel: string, fps: number, canvasWidth: number, canvasHeight: number): string[] => {
  const textFilters: string[] = [];
  let currentLabel = inputLabel;
  
  textTracks.forEach((textTrack, index) => {
    const textStartTime = textTrack.display.from / 1000;
    const textEndTime = textTrack.display.to / 1000;
    const text = textTrack.details.text || 'Sample Text';
    const rawFontSize = textTrack.details.fontSize || 24;
    const fontColor = textTrack.details.color || '#ffffff';
    const backgroundColor = textTrack.details.backgroundColor || 'transparent';
    const textAlign = textTrack.details.textAlign || 'center';
    const borderWidth = textTrack.details.borderWidth || 0;
    const borderColor = textTrack.details.borderColor || '#000000';
    
    // Get font family early for debug logging
    const fontFamily = textTrack.details.fontFamily || 'Arial';
    
    // Get position from display object with debug logging
    const rawXText = textTrack.display?.position?.x || 0;
    const rawYText = textTrack.display?.position?.y || 0;
    
    // ✅ TEXT POSITION FIX: ใช้ composition size โดยตรง (เหมือน video scaling)
    // ไม่ต้อง scale เพราะ frontend ส่ง position ที่ถูกต้องแล้ว (อิงตาม composition size)
    const fontSize = rawFontSize; // ใช้ font size ตามที่ user กำหนด
    const xText = Math.max(0, Math.min(rawXText, canvasWidth - 10));
    const yText = Math.max(fontSize, Math.min(rawYText + fontSize, canvasHeight - 10));
    
    console.log(`🎯 Text Position Fix for "${text}":`);
    console.log(`  Raw Position: x=${rawXText}, y=${rawYText}`);
    console.log(`  Font Size: ${fontSize}px`);
    console.log(`  Canvas Size: ${canvasWidth}x${canvasHeight}`);
    console.log(`  Final Position: x=${xText}, y=${yText}`);
    console.log(`  Text Align: ${textAlign}`);
    console.log(`  Font: ${fontFamily}`);
    
    console.log(`  Final FFmpeg Position: x=${xText}, y=${yText}`);
    
    // Create next output label
    const nextLabel = index === textTracks.length - 1 ? '[final_with_text]' : `[text_${index}]`;
    
    // Escape text for FFmpeg (replace special characters)
    const escapedText = text
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/,/g, "\\,");
    
    // Build drawtext filter
    let drawtextFilter = `${currentLabel}drawtext=`;
    drawtextFilter += `text='${escapedText}':`;
    drawtextFilter += `fontsize=${fontSize}:`;
    drawtextFilter += `fontcolor=${fontColor}:`;
    
    // Add font family if specified (only for system fonts that FFmpeg recognizes)
    const systemFonts = ['Arial', 'Impact', 'Times', 'serif', 'sans-serif', 'monospace'];
    if (fontFamily && systemFonts.includes(fontFamily)) {
      drawtextFilter += `font='${fontFamily}':`;
    }
    
    // For text alignment in FFmpeg, we don't need to manually calculate x offset
    // FFmpeg drawtext has built-in alignment support
    drawtextFilter += `x=${xText}:y=${yText}:`;
    
    // Add text alignment if not left (FFmpeg doesn't have direct textAlign, but we can use positioning)
    if (textAlign === 'center') {
      // For center align, we need to adjust the x position
      drawtextFilter = drawtextFilter.replace(`x=${xText}:`, `x=(w-text_w)/2:`);
    } else if (textAlign === 'right') {
      // For right align
      drawtextFilter = drawtextFilter.replace(`x=${xText}:`, `x=w-text_w-${Math.max(10, xText)}:`);
    }
    // left alignment uses the specified x position
    
    // Add border/outline if specified
    if (borderWidth > 0) {
      drawtextFilter += `borderw=${borderWidth}:bordercolor=${borderColor}:`;
    }
    
    // Add background color if not transparent
    if (backgroundColor !== 'transparent') {
      drawtextFilter += `box=1:boxcolor=${backgroundColor}:`;
    }
    
    // Add timing
    drawtextFilter += `enable='between(t,${textStartTime},${textEndTime})'`;
    drawtextFilter += nextLabel;
    
    textFilters.push(drawtextFilter);
    currentLabel = nextLabel;
    
    console.log(`✅ Text overlay ${index} created: "${text}"`);
    console.log(`   Position: (${xText},${yText}), Align: ${textAlign}, Font: ${fontFamily}`);
    console.log(`   Time: ${textStartTime}s to ${textEndTime}s`);
    console.log(`   Filter: ${drawtextFilter}`);
  });
  
  return textFilters;
};

// Future implementation with Remotion
/*
const renderWithRemotion = async (job: RenderJobData, outputPath: string): Promise<void> => {
  // Bundle the Remotion composition
  const bundled = await bundle(path.join(__dirname, '../remotion/index.ts'), undefined, {
    // Add any bundling options here
  });

  // Get composition
  const compositions = await selectComposition({
    serveUrl: bundled,
    id: 'VideoComposition',
    inputProps: {
      trackItems: job.design.trackItems,
      transitions: job.design.transitions,
      size: job.options.size
    }
  });

  // Render the video
  await renderMedia({
    composition: compositions,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: {
      trackItems: job.design.trackItems,
      transitions: job.design.transitions,
      size: job.options.size
    },
    crf: parseInt(process.env.REMOTION_CRF || '18'),
    concurrency: parseInt(process.env.REMOTION_CONCURRENCY || '1')
  });
};
*/
