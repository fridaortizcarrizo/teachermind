import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ModuleCategory {
  name: string;
  words: string[];
}

export default function Settings() {
  const { user } = useAuth();
  const { data: professionalModules = [], isLoading } = useQuery({
    queryKey: ["professional_modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_modules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary Modules</h1>
          <p className="text-muted-foreground mt-1">Professional vocabulary organized by career field</p>
        </div>
        <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" />New Module</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : professionalModules.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <p className="text-muted-foreground">No vocabulary modules yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {professionalModules.map((mod) => {
            const categories = (mod.categories as ModuleCategory[]) || [];
            return (
              <GlassCard key={mod.id}>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold font-display">{mod.profession}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.name} className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <h3 className="font-semibold text-sm mb-2">{cat.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {cat.words.map((w) => (
                          <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{w}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
