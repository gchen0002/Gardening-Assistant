import { supabase } from "@/lib/supabaseClient";
import AddPlantForm from "@/components/AddPlantForm";
import PlantListItem from "@/components/PlantListItem";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Need this for server-side auth check
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button"; // Import Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components
import { Accordion } from "@/components/ui/accordion"; // Import Accordion
import { PlusCircle, HomeIcon, Settings, Sprout, UserCircle, MessageSquare, Heart, LogOut } from 'lucide-react'; // Import icons
import { ThemeToggleButton } from "@/components/ThemeToggleButton"; // Import the toggle button
import { logout } from './auth/actions'; // Import the logout action
import { Plant } from '@/types/plant'; // Import the Plant type

export default async function Home() {
  const cookieStore = cookies();
  const supabaseServer = createServerComponentClient({ cookies: () => cookieStore });

  // Check if user is logged in
  const { data: { user } } = await supabaseServer.auth.getUser();

  // If not logged in, redirect to login page
  if (!user) {
    redirect('/login');
  }

  // Fetch data from Supabase (only if user is logged in)
  // Using the client-side initialized supabase for data fetching here
  // For server-side fetch ONLY for logged-in user, you'd use supabaseServer
  // and likely filter by user_id based on RLS or explicit where clause.
  // Let's assume RLS is setup or data is public for simplicity for now.
  const { data: plants, error } = await supabase
    .from('plants')
    .select('*');

  if (error) {
    console.error("Error fetching plants:", error);
  }

  const plantList = plants as Plant[] || [];

  return (
    // Main container with flex layout and dark theme
    <div className="flex min-h-screen bg-background text-foreground relative">
      
      {/* Sidebar */}
      <aside className="w-64 bg-card text-card-foreground p-4 border-r border-border flex flex-col">
        <h2 className="text-xl font-semibold mb-6">Gardening Asst.</h2>
        <nav className="flex-grow mb-4">
          {/* Updated button styling to match reference */}
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start px-3 py-2 flex bg-gray-800/40 hover:bg-gray-700/60 text-white">
              <HomeIcon className="mr-3 h-5 w-5" /> Home
            </Button>
          </div>
        </nav>
        <div className="mt-auto">
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* Add theme toggle to top right of main content area */}
        <div className="absolute top-2 right-4 z-10">
          <ThemeToggleButton />
        </div>
        
        {/* START Create a two-column grid layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left column - Plants section */}
          <div className="col-span-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">My Garden</h1>
            </div>

            {error && <p className="text-destructive text-center mb-4">Could not fetch plants.</p>}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">My Plants</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary"> {/* Adjusted button variant for dark mode */}
                       <PlusCircle className="mr-2 h-4 w-4" /> Add Plant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <div className="text-center w-full bg-primary/20 text-primary py-1 rounded-sm text-xs font-medium mb-1">
                        ADD PLANT
                      </div>
                      <DialogTitle className="text-primary flex items-center gap-1">
                        <PlusCircle className="h-3.5 w-3.5"/>
                        <span>New Garden Plant</span>
                      </DialogTitle>
                    </DialogHeader>
                    <AddPlantForm />
                  </DialogContent>
                </Dialog>
              </div>

              {plantList.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-1">
                  {plantList.map((plant) => (
                    <PlantListItem key={plant.id} plant={plant} />
                  ))}
                </Accordion>
              ) : (
                !error && <p className="text-muted-foreground text-center py-4">No plants added yet. Click Add Plant!</p>
              )}
            </div>
          </div>

          {/* Right column - Empty for now */}
          <div className="col-span-1">
            {/* Content for the right half will go here */}
          </div>
        </div>
        {/* END Create a two-column grid layout */}
      </main>
    </div>
  );
} 