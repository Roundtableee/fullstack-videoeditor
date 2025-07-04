interface TTSRequest {
  text: string;
  speaker: string;
  volume: number;
  speed: number;
  type_media: string;
  save_file: string;
  language: string;
}

interface TTSResponse {
  text: string;
  audio_url: string;
  point: number;
  user_monthly_point: number;
}

const TTS_API_URL = import.meta.env.VITE_PUBLIC_TTS_API_URL || 'https://api.botnoi.ai/api/tts';

// Mock data for development
const MOCK_TTS_RESPONSE: TTSResponse = {
  text: "วันนี้เราจะนำเสนอ",
  audio_url: "images/6cd08db0635f4e24c0ade918079181115841632161472d82f6d8993f8a71b624_05262025051004576668.wav",
  point: 553940,
  user_monthly_point: 0
};

export const generateTTS = async (text: string): Promise<TTSResponse> => {
  // Use mock data in development
  if (import.meta.env.DEV) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ...MOCK_TTS_RESPONSE,
      text // Use the actual input text
    };
  }

  const payload: TTSRequest = {
    text,
    speaker: "1",
    volume: 1,
    speed: 1,
    type_media: "m4a",
    save_file: "true",
    language: "th",
  };

  const response = await fetch(TTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_BOTNOI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.statusText}`);
  }

  return response.json();
}; 