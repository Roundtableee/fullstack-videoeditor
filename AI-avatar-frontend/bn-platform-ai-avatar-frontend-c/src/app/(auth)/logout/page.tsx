"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      router.push("/");
      router.refresh();
    };
    handleSignOut();
  }, [router]);

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-cover bg-center px-10" style={{ backgroundImage: "url('/img/carbg.jpg')" }}>
      <div className="w-full max-w-lg p-8 bg-white bg-opacity-80 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-[#5C4590]">
            Signing out...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we sign you out
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE7F3F]"></div>
        </div>
      </div>
    </div>
  );
}
