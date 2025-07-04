"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/utils/supabase/client"

interface UserProfile {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
  updated_at?: string;
}

export function UserDropdown() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error && error.name === 'AuthSessionMissingError' && !user) {
            return;
        }
        else if(error) throw error;

        if (user) {

          setUser({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? "", // fallback if missing
            avatar_url: user.user_metadata?.avatar_url ?? "", // fallback if missing
            updated_at: undefined, // or use user.updated_at if you want
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name ?? "",
        avatar_url: session.user.user_metadata?.avatar_url ?? "",
        updated_at: undefined,
      });
    } else {
    setUser(null);
    }

    });

    return () => {
        listener.subscription.unsubscribe();
    };

  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={() => router.push("/login")}
      >
        <User className="h-5 w-5" />
        Sign In
      </Button>
    );
  }

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between gap-2 px-2 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 transition-transform duration-200">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary/10">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium line-clamp-1">
              {user.full_name || user.email || "User"}
            </span>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="end" 
        forceMount
        sideOffset={4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/billing")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}