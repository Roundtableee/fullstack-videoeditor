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
    const { width = 1280, height = 720 } = job.options?.size || {};
    
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
    
    console.log('Track summary:', {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      imageTracks: imageTracks.length,
      totalDuration: duration
    });
    
    let command = ffmpeg();
    let complexFilterString = ''; // Use a single string for the filter graph
    let outputVideoLabel = '0:v'; // Default video output
    let outputAudioLabel = '0:a'; // Default audio output
    let validVideoTracks: any[] = [];
    let hasVideoAudio = false; // To track if the video stream has audio

    // If we have video tracks, handle multiple videos
    if (videoTracks.length > 0) {
      console.log('Processing multiple video tracks:', videoTracks.length);
      
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
      
      if (validVideoTracks.length === 1) {
        // Single video - simple case
        const mainVideo = validVideoTracks[0];
        
        console.log('Using single video:', mainVideo.resolvedSrc);
        command = command.input(mainVideo.resolvedSrc);
        
        // Scale video to match output size
        command = command.videoFilters([
          `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`
        ]);
        
        hasVideoAudio = true; // Single video keeps its audio
        
      } else {
        // --- OVERLAY LOGIC FOR MULTIPLE VIDEOS ---
        console.log(`Overlaying ${validVideoTracks.length} videos...`);

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

          // Helper function to clean dimension values
          const cleanDimension = (value: any, fallback: number): number => {
            if (typeof value === 'string') {
              // Remove 'px' suffix and other units, extract number
              const numMatch = value.match(/\d+\.?\d*/);
              return numMatch ? parseInt(numMatch[0]) : fallback;
            } else if (typeof value === 'number') {
              return Math.round(value);
            }
            return fallback;
          };

          // Get video dimensions from details or use default scaling
          let videoWidth = cleanDimension(video.details?.width, width);
          let videoHeight = cleanDimension(video.details?.height, height);
          
          // If video has position data, it's likely a positioned element (not main background)
          const hasPosition = video.display?.position && 
            (video.display.position.x !== 0 || video.display.position.y !== 0);
          
          // For positioned videos, use the dimensions from editor or scale appropriately
          if (hasPosition) {
            // If dimensions are provided in details, use them
            if (video.details?.width && video.details?.height) {
              videoWidth = video.details.width;
              videoHeight = video.details.height;
            } else {
              // Default to smaller size for overlay videos
              videoWidth = Math.floor(width / 3); // 1/3 of main video width
              videoHeight = Math.floor(height / 3); // 1/3 of main video height
            }
          } else {
            // Main video (no position or position 0,0) uses full canvas size
            videoWidth = width;
            videoHeight = height;
          }

          console.log(`Video ${index}: size=${videoWidth}x${videoHeight}, positioned=${hasPosition}, position=${JSON.stringify(video.display?.position)}`);

          // Trim, scale, pad, and set PTS for video
          const videoChain = 
            `[${index}:v]trim=start=0:duration=${clipDuration},` +
            `scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,` +
            `pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:black,` +
            `setsar=1,` +
            `setpts=PTS-STARTPTS+${videoStartTime}/TB[v${index}]`;
          filterChains.push(videoChain);

          // Trim, set PTS for audio, and prepare for mixing
          const audioChain = `[${index}:a]atrim=start=0:duration=${clipDuration},asetpts=PTS-STARTPTS+${videoStartTime}/TB[a${index}]`;
          filterChains.push(audioChain);
          audioStreamsToMix.push(`[a${index}]`);
        });

        // 2. Create a base canvas to overlay videos onto
        const totalDurationSec = duration / 1000;
        const baseCanvas = `color=c=black:s=${width}x${height}:d=${totalDurationSec}[base]`;
        filterChains.unshift(baseCanvas); // Add to the beginning of the filter chains

        // 3. Chain the overlay filters
        let lastOverlayOutput = '[base]';
        validVideoTracks.forEach((video, index) => {
          const nextOverlayInput = `[v${index}]`;
          const newOverlayOutput = index === validVideoTracks.length - 1 ? '[final]' : `[ov${index}]`;
          
          // Get position from display object, default to 0,0
          let x = video.display?.position?.x ?? 0;
          let y = video.display?.position?.y ?? 0;
          
          // Handle scale factor if provided
          const scale = video.details?.scale || 1;
          
          // Clean and normalize position values
          const cleanPosition = (pos: any): number => {
            if (typeof pos === 'string') {
              // Remove 'px' suffix and other units, extract number
              const numMatch = pos.match(/-?\d+\.?\d*/);
              return numMatch ? parseFloat(numMatch[0]) : 0;
            } else if (typeof pos === 'number') {
              return pos;
            }
            return 0;
          };
          
          // Apply cleaning to x and y positions
          x = cleanPosition(x);
          y = cleanPosition(y);
          
          // Apply scale to position if needed
          if (scale !== 1) {
            x = Math.round(x * scale);
            y = Math.round(y * scale);
          }
          
          // Ensure values are integers for FFmpeg
          x = Math.round(x);
          y = Math.round(y);
          
          const startTimeSec = video.display.from / 1000;
          const endTimeSec = video.display.to / 1000;

          console.log(`Video ${index}: overlay at x=${x}, y=${y} (scale=${scale}) from ${startTimeSec}s to ${endTimeSec}s`);

          const overlayFilter = `${lastOverlayOutput}${nextOverlayInput}overlay=x=${x}:y=${y}:enable='between(t,${startTimeSec},${endTimeSec})'${newOverlayOutput}`;
          filterChains.push(overlayFilter);
          lastOverlayOutput = newOverlayOutput;
        });
        
        outputVideoLabel = lastOverlayOutput; // The final video is the result of the last overlay

        // 4. Mix all audio streams
        if (audioStreamsToMix.length > 0) {
          const amixFilter = `${audioStreamsToMix.join('')}amix=inputs=${audioStreamsToMix.length}:duration=longest[outa]`;
          filterChains.push(amixFilter);
          outputAudioLabel = '[outa]';
          hasVideoAudio = true;
        } else {
          hasVideoAudio = false;
        }

        // Join all filter chains for the final complex filter string
        complexFilterString = filterChains.join(';');
      }
      
    } else if (imageTracks.length > 0) {
      // If we have images but no videos, create video from first image
      const mainImage = imageTracks[0];
      const imageSrc = resolveMediaPath(mainImage.details?.src || '');
      
      if (checkFileExists(imageSrc)) {
        console.log('✓ Using main image:', imageSrc);
        command = command.input(imageSrc)
          .inputOptions(['-loop 1', '-t', `${duration / 1000}`]);
        
        // Scale image to match output size
        const imageFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;
        command = command.videoFilters(imageFilter);
        outputVideoLabel = '0:v'; // Video is from the first input
        hasVideoAudio = false;

      } else {
        console.warn('✗ Missing image file, creating blank video:', imageSrc);
        // Fallback: create blank video
        command = command.input(`color=c=black:size=${width}x${height}:duration=${duration / 1000}:rate=${job.options.fps}`)
          .inputFormat('lavfi');
        outputVideoLabel = '0:v';
        hasVideoAudio = false;
      }
      
    } else {
      // Fallback: create blank video
      console.log('No video/image content found, creating blank video');
      command = command.input(`color=c=black:size=${width}x${height}:duration=${duration / 1000}:rate=${job.options.fps}`)
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
      console.log('Applying complex filter:', complexFilterString);
      command = command.complexFilter(complexFilterString);
    }

    // Set final output mappings
    const outputOptions = [
      '-map', outputVideoLabel,
      '-map', outputAudioLabel,
      '-c:v libx264',
      '-c:a aac',
      '-shortest'
    ];

    // If there's no audio, remove audio-related options
    if (!hasVideoAudio && audioTracks.length === 0) {
      console.log('No audio stream available. Rendering video-only.');
      outputOptions.splice(1, 2); // Remove '-map', outputAudioLabel
      outputOptions.splice(2, 2); // Remove '-c:a', 'aac'
    } else if (outputAudioLabel.includes(':a') && !hasVideoAudio) {
      // Case for image + external audio, where we need to map both
    } else if (!outputAudioLabel.includes('[') && !hasVideoAudio) {
       // No audio stream available.
       console.log('No audio stream available. Rendering video-only.');
       outputOptions.splice(1, 2); // Remove '-map', outputAudioLabel
       outputOptions.splice(2, 2); // Remove '-c:a', 'aac'
    }


    console.log('Final output options:', outputOptions);
    command = command.outputOptions(outputOptions);

    command
      .output(outputPath)
      .outputOptions([
        '-pix_fmt yuv420p',
        `-crf ${job.options.crf || 18}`,
        '-preset medium',
        `-r ${job.options.fps}`,
       // `-t ${duration / 1000}` // Set duration
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

// Helper function to resolve media file paths
const resolveMediaPath = (src: string): string => {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src; // External URL
  }
  
  if (src.startsWith('/uploads/')) {
    // Local upload - convert to absolute path
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadDir, src.replace('/uploads/', ''));
  }
  
  // Assume it's already a valid file path
  return src;
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
  
  // Calculate based on display.to values from trackItems
  // Sort trackItems by display.from to ensure proper order
  const sortedItems = trackItems
    .filter(item => item.display?.from !== undefined && item.display?.to !== undefined)
    .sort((a, b) => a.display.from - b.display.from);
  
  console.log('📊 Timeline analysis:');
  sortedItems.forEach((item, index) => {
    console.log(`  ${index}: ${item.type} from ${item.display.from}ms to ${item.display.to}ms (duration: ${item.display.to - item.display.from}ms)`);
  });
  
  if (sortedItems.length === 0) {
    return 5000; // Default if no valid items
  }
  
  // For multiple videos, calculate total duration as sum of all video durations
  const videoItems = sortedItems.filter(item => item.type === 'video');
  if (videoItems.length > 1) {
    const totalVideoDuration = videoItems.reduce((total, video) => {
      const videoDuration = video.display?.to - video.display?.from || 5000;
      return total + videoDuration;
    }, 0);
    
    console.log(`📏 Total video duration (sum): ${totalVideoDuration}ms`);
    return Math.max(totalVideoDuration, 1000); // Minimum 1 second
  }
  
  // For single video or other cases, use maximum end time
  const maxEnd = Math.max(...sortedItems.map(item => item.display.to));
  
  console.log(`📏 Total timeline duration: ${maxEnd}ms`);
  return Math.max(maxEnd, 1000); // Minimum 1 second
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
