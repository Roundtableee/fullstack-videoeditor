"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems, assetNavItems } from "@/lib/data";
import { DivideIcon as LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserDropdown } from "@/components/layout/UserDrowdown";
import { ServiceSelectionModal, ServiceOption } from "@/components/ui/service-selection-modal";

const serviceOptions: ServiceOption[] = [
  {
    key: "video",
    name: "Video Editor",
    description: "Create and edit videos with AI avatars, text, and more.",
    icon: <Icons.Video className="h-5 w-5 text-blue-500" />,
    href: "/video-editor",
  },
  // Add more services here as needed, each with an href property
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [serviceModalOpen, setServiceModalOpen] = React.useState(false);

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = Icons[name as keyof typeof Icons] as typeof LucideIcon;
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-60 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-6 flex items-center px-2">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-semibold">VideoGen</span>
          </Link>
        </div>

        <UserDropdown/>

        <div className="mt-2">
          <button
            onClick={() => setServiceModalOpen(true)}
            className="w-full flex items-center gap-2 bg-black text-white rounded-lg py-2 px-3 hover:bg-gray-800 transition-colors"
          >
            <Icons.Play className="h-4 w-4" /> Create video
          </button>
        </div>
        <ServiceSelectionModal
          open={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          services={serviceOptions}
          onSelect={(service) => {
            setServiceModalOpen(false);
            if (service.href) {
              router.push(service.href);
            }
            // Add more navigation logic for other services as needed
          }}
        />

        <Separator className="my-4" />

        <nav className="flex-1 space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100",
                pathname === item.href
                  ? "bg-gray-100 font-medium"
                  : "font-normal"
              )}
            >
              <IconComponent name={item.icon} />
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Test Modals Link */}
        <div className="mt-4">
          <Link
            href="/test-modals"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-blue-700 hover:bg-blue-100 font-medium border border-blue-100",
              pathname === "/test-modals" ? "bg-blue-100" : ""
            )}
          >
            <Icons.TestTube2 className="h-5 w-5" />
            <span className="ml-3">Test Modals</span>
          </Link>
        </div>

        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-medium uppercase text-gray-500">
            Assets
          </p>
          <nav className="space-y-1">
            {assetNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100",
                  pathname === item.href
                    ? "bg-gray-100 font-medium"
                    : "font-normal"
                )}
              >
                <IconComponent name={item.icon} />
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;