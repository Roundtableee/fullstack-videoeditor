# Video Export Implementation

## Overview
The video export functionality is split between two projects:
1. Main Platform (`bn-platform-ai-avatar-frontend`)
2. Video Editor (`react-video-editor-main`)

## Video Editor Project
The video editor project handles the initial video generation request and provides the editing interface.

### Components
1. **VideoRenderService** (`src/services/video.ts`)
   - Singleton service for video rendering
   - Handles initial render request to backend server
   - Returns session ID from backend response

2. **Download State** (`src/features/editor/store/use-download-state.ts`)
   - Manages export state using Zustand
   - Handles export initialization
   - Communicates session ID back to main platform via iframe

### Flow
1. User initiates export
2. Video editor sends design and options to backend server
3. Backend server returns session ID
4. Video editor sends session ID to main platform via iframe communication
5. Main platform takes over for status tracking and download

## Main Platform Project
The main platform handles status tracking and downloading.

### Responsibilities
1. Status Tracking
   - Receives session ID from video editor via iframe
   - Periodically fetches status from backend server
   - Updates UI with progress
   - Manages job states

2. Download Management
   - Handles video file storage
   - Manages download URLs
   - Provides download functionality

## Integration Points
1. **API Endpoints**
   - `/api/render` - Initial render request (returns session ID)
   - `/api/render/status` - Status checking (using session ID)

2. **Data Flow**
   - Video Editor → Backend: Design and options
   - Backend → Video Editor: Session ID
   - Video Editor → Main Platform: Session ID (via iframe)
   - Main Platform → Backend: Status checks (using session ID)
   - Main Platform → User: Progress updates and download

## Communication Flow
1. **Iframe Communication**
   - Video editor sends session ID to parent window
   - Main platform listens for session ID
   - Main platform starts status polling
   - **Current Limitation**: Main platform does not send user identification key to video editor

2. **Status Polling**
   - Main platform periodically checks status using session ID
   - Updates UI based on status response
   - Handles completion and errors

## Proposed User ID Flow
1. **Initial Setup**
   - Main platform sends user ID to video editor when iframe loads
   - Video editor stores user ID in secure storage (e.g., sessionStorage)
   - User ID is used for all subsequent API calls

2. **Message Flow**
   ```
   Main Platform → Video Editor: 
   {
     type: 'INIT_USER',
     payload: {
       userId: string
     }
   }
   ```

3. **Video Generation Flow**
   - Video editor includes stored user ID in generate request
   - Backend associates video generation with user ID
   - Session ID returned includes user context
   - Main platform can verify user context when receiving session ID

4. **Security Considerations**
   - User ID should be validated on both ends
   - Session storage should be cleared when iframe unloads
   - All API calls should include user ID for verification

## Future Improvements
1. WebSocket integration for real-time updates
2. Enhanced error handling and retry logic
3. Progress tracking improvements
4. Download management enhancements
5. Add user identification key passing from main platform to video editor 