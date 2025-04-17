import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logout } from './auth/actions'; // Import the logout action
import { LogOut, LogIn } from 'lucide-react'; // Import icons
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider"; // Import ThemeProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gardening Assistant",
  description: "Your personal gardening assistant",
};

// Simple Header Component (can be moved to its own file later)
async function Header() {
  const cookieStore = cookies(); 
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Use getUser() for server-side validation
  const { data: { user } } = await supabase.auth.getUser(); // Changed from getSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">Gardening Assistant</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">{user.email}</span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Make RootLayout async
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased", // Removed flex flex-col here
        inter.className
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header might need adjustment if it shouldn't be part of themed content */}
          {/* Or if sidebar/main layout is handled differently now */}
          {/* Header() */}
          {/* Removed Header and flex-col from body - page.tsx now handles main layout */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 