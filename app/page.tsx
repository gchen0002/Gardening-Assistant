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
import { PlusCircle, HomeIcon, Settings, Sprout, UserCircle, MessageSquare, Heart, LogOut, Droplets } from 'lucide-react'; // Import icons
import { ThemeToggleButton } from "@/components/ThemeToggleButton"; // Import the toggle button
import { logout } from './auth/actions'; // Import the logout action
import { Plant } from '@/types/plant'; // Import the Plant type
import WaterAllPlantsButton from "@/components/WaterAllPlantsButton"; // Import the water all plants button
import Link from 'next/link';
import Sidebar from "@/components/Sidebar"; // Import the Sidebar component

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
  
  // Calculate how many plants need watering
  const now = new Date();
  const plantsNeedingWater = plantList.filter(plant => 
    plant.next_watering_date && new Date(plant.next_watering_date) <= now
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground relative"> 
      
      {/* Use the Sidebar component */}
      <Sidebar user={user} /> 

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* Theme toggle remains here */}
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
                <div>
                  <h2 className="text-2xl font-semibold">My Plants</h2>
                  {plantsNeedingWater.length > 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                      {plantsNeedingWater.length} plant{plantsNeedingWater.length !== 1 ? 's' : ''} need{plantsNeedingWater.length === 1 ? 's' : ''} watering
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {/* Always show WaterAllPlantsButton, but it will render differently based on the plantsCount */}
                  <WaterAllPlantsButton plantsCount={plantsNeedingWater.length} />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary"> {/* Adjusted button variant for dark mode */}
                         <PlusCircle className="mr-2 h-4 w-4" /> Add Plant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[350px]">
                      {/* Add visually hidden DialogTitle/Description for accessibility */}
                      <DialogHeader className="sr-only">
                        <DialogTitle>Add New Plant</DialogTitle>
                        <DialogDescription>Fill in the details to add a plant to your garden.</DialogDescription>
                      </DialogHeader>
                      <AddPlantForm />
                    </DialogContent>
                  </Dialog>
                </div>
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