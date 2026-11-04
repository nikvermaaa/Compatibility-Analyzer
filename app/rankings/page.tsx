import { supabase } from "@/lib/db";
import { RankingsClientView } from "./RankingsClientView";

export const dynamic = "force-dynamic";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const { person: selectedPersonId } = await searchParams;

  // Fetch all people with profiles and rankings
  const { data: people = [] } = await supabase
    .from("people")
    .select(`
      id, name, slug, photo_url,
      profiles(*),
      rankings(*)
    `)
    .order("name", { ascending: true });

  // Fetch all completed dates for top couples calculation
  const { data: dates = [] } = await supabase
    .from("dates")
    .select(`
      id, a_id, b_id, outcome, chemistry, date_card,
      person_a:people!dates_a_id_fkey(id, name, slug, photo_url),
      person_b:people!dates_b_id_fkey(id, name, slug, photo_url)
    `)
    .eq("status", "done")
    .order("chemistry", { ascending: false });

  // Fetch all pairwise swipes to render the 25x25 heatmap
  const { data: swipes = [] } = await supabase.from("swipes").select("from_id, to_id, score");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <RankingsClientView
        initialPeople={people || []}
        dates={dates || []}
        swipes={swipes || []}
        selectedPersonId={selectedPersonId}
      />
    </div>
  );
}
