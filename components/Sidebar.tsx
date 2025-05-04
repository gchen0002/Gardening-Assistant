// 'use server'; // Remove this directive - likely causing the error

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { HomeIcon, Sprout, UserCircle, LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions'; // Adjust path if needed
import { User } from '@supabase/supabase-js'; // Import User type

interface SidebarProps {
  user: User | null; // Accept user object or null
}

export default function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="w-64 bg-card text-card-foreground p-4 border-r border-border flex flex-col h-screen sticky top-0"> {/* Added h-screen sticky top-0 */}
      <h2 className="text-xl font-semibold mb-6">Gardening Asst.</h2>
      <nav className="flex-grow mb-4">
        <div className="space-y-2">
            {/* TODO: Add active state logic based on current route */}
          <Link href="/" passHref>
            <Button variant="ghost" className="w-full justify-start px-3 py-2 flex hover:bg-gray-700/60"> {/* Use consistent styling */}
              <HomeIcon className="mr-3 h-5 w-5" /> Home
            </Button>
          </Link>
          <Link href="/plants" passHref>
            <Button variant="ghost" className="w-full justify-start px-3 py-2 flex hover:bg-gray-700/60">
              <Sprout className="mr-3 h-5 w-5" /> Find Plants
            </Button>
          </Link>
          {/* Add other future nav links here */}
        </div>
      </nav>
      <div className="mt-auto">
        {user ? (
          <>
            {/* Account indicator */}
            <div className="mb-4 p-2 text-sm text-muted-foreground">
              <span className="flex items-center">
                <UserCircle className="mr-2 h-5 w-5" />
                {user.email || 'Current Account'}
              </span>
            </div>
            {/* Logout Form */}
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit" className="w-full justify-start px-2 py-1.5 text-sm">
                <LogOut className="mr-3 h-5 w-5" /> Logout
              </Button>
            </form>
          </>
        ) : (
          // Optional: Show login button if user is null
          <Link href="/login" passHref>
             <Button variant="outline" className="w-full">
                 Login
             </Button>
          </Link>
        )}
      </div>
    </aside>
  );
} 