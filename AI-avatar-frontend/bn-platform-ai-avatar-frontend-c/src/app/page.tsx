import HeroSection from "@/components/home/HeroSection";
import CreateVideoSection from "@/components/home/CreateVideoSection";
import VideoToolsSection from "@/components/home/VideoToolsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <HeroSection />
        <CreateVideoSection />
        <VideoToolsSection />
      </div>
    </div>
  );
}