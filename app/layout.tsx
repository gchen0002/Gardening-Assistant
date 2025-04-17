import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logout } from './auth/actions'; // Import the logout action

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
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">Gardening Assistant</Link>
      <div>
        {/* Check for user instead of session */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* Use user.email */}
            <span>{user.email}</span> 
            <form action={logout}>
              <button 
                type="submit"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Login
          </Link>
        )}
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
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* No need for SupabaseProvider here for basic auth status */}
        <Header />
        <main className="flex-grow container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
} 