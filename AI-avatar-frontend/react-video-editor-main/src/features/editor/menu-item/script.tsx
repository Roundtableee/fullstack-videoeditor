import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO } from "@designcombo/state";
import { IAudio } from "@designcombo/types";
import { generateId } from "@designcombo/timeline";
import { Loader2 } from "lucide-react";
import { addAudioToList } from "../data/audio";
import { generateTTS } from "@/services/tts";

export const Script: React.FC = () => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await generateTTS(text);

      // Create audio item from response
      const audioItem: Partial<IAudio> = {
        id: generateId(),
        name: text.substring(0, 20) + (text.length > 20 ? "..." : ""),
        type: "audio",
        details: {
          src: data.audio_url,
        },
        metadata: {
          author: "TTS Generated",
        },
      };

      // Add to audio list
      addAudioToList(data.audio_url, text);

      // Add to timeline
      dispatch(ADD_AUDIO, {
        payload: audioItem,
        options: {},
      });

      // Clear input
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Text to Speech
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-4 p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Audio"
              )}
            </Button>
          </form>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 