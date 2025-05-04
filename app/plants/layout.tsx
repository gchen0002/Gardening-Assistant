import Sidebar from "@/components/Sidebar";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ThemeToggleButton } from "@/components/ThemeToggleButton"; // Keep theme toggle if needed in this section

export default async function PlantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabaseServer = createServerComponentClient({ cookies: () => cookieStore });

  // Check if user is logged in (needed for Sidebar)
  const { data: { user } } = await supabaseServer.auth.getUser();

  // Optional: Redirect if not logged in, depending on whether anonymous users can search
  // if (!user) {
  //   redirect('/login');
  // }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar user={user} /> {/* Pass user data to Sidebar */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative">
         {/* Position ThemeToggleButton within the main content area if desired */}
         <div className="absolute top-2 right-4 z-10">
           <ThemeToggleButton />
         </div>
        {children} {/* Render the specific page content here */}
      </main>
    </div>
  );
} 