// Debug script to test FFmpeg command manually
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Example test: Create a simple video
function testBasicVideo() {
  console.log('Testing basic video creation...');
  
  const outputPath = './test-output.mp4';
  
  ffmpeg()
    .input('color=c=black:size=1920x1080:duration=5:rate=30')
    .inputFormat('lavfi')
    .outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-crf 18',
      '-preset medium'
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
      console.log('FFmpeg command:', commandLine);
    })
    .on('progress', (progress) => {
      console.log(`Progress: ${Math.round(progress.percent || 0)}%`);
    })
    .on('stderr', (stderrLine) => {
      console.log('FFmpeg stderr:', stderrLine);
    })
    .on('end', () => {
      console.log('✓ Test completed successfully!');
    })
    .on('error', (err, stdout, stderr) => {
      console.error('✗ Test failed:');
      console.error('Error:', err.message);
      console.error('Stdout:', stdout);
      console.error('Stderr:', stderr);
    })
    .run();
}

// Test if FFmpeg is working
function testFFmpegInstallation() {
  console.log('Testing FFmpeg installation...');
  console.log('FFmpeg path:', ffmpegStatic);
  
  ffmpeg()
    .input('color=c=red:size=320x240:duration=1:rate=1')
    .inputFormat('lavfi')
    .output('./ffmpeg-test.mp4')
    .on('start', (commandLine) => {
      console.log('✓ FFmpeg is working!');
      console.log('Command:', commandLine);
    })
    .on('end', () => {
      console.log('✓ FFmpeg test successful!');
    })
    .on('error', (err) => {
      console.error('✗ FFmpeg test failed:', err.message);
    })
    .run();
}

// Run tests
console.log('Starting FFmpeg debug tests...');
testFFmpegInstallation();

setTimeout(() => {
  testBasicVideo();
}, 2000);
