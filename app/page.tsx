import { supabase } from "@/lib/supabaseClient";
import AddPlantForm from "@/components/AddPlantForm";
import PlantListItem from "@/components/PlantListItem";

export default async function Home() {
  // Fetch data from Supabase
  const { data: plants, error } = await supabase
    .from('plants') // Your table name
    .select('*'); // Select all columns

  if (error) {
    console.error("Error fetching plants:", error);
    // Optionally render an error message to the user
  }

  // Ensure plants is an array even if data is null/undefined
  const plantList = plants || [];

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Gardening Assistant</h1>

      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">My Plants</h2>
        {error && <p className="text-red-500">Could not fetch plants.</p>}
        {plantList.length > 0 ? (
          <ul className="space-y-2">
            {/* Map over plants and render PlantListItem for each */}
            {plantList.map((plant) => (
              <PlantListItem key={plant.id} plant={plant as any} />
            ))}
          </ul>
        ) : (
          !error && <p>No plants added yet.</p>
        )}
        <AddPlantForm />
      </div>
    </main>
  );
} 