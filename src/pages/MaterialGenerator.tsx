import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, FileText, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { CEFRLevel, MaterialType } from "@/types";

const materialTypes: { value: MaterialType; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening Exercise" },
  { value: "grammar_drill", label: "Grammar Drill" },
  { value: "speaking_prompt", label: "Speaking Prompt" },
  { value: "vocabulary_task", label: "Vocabulary Task" },
  { value: "fill_blanks", label: "Fill in the Blanks" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "matching", label: "Matching Exercise" },
];

const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

interface GeneratedMaterial {
  title: string;
  content: string;
}

export default function MaterialGenerator() {
  const { user } = useAuth();
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedMaterial | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-material", {
        body: { type, level, topic },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenerated(data as GeneratedMaterial);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error generating material", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated || !user) return;
    try {
      const { error } = await supabase.from("materials").insert({
        user_id: user.id,
        title: generated.title,
        content: generated.content,
        type: type as MaterialType,
        level: level as CEFRLevel,
        topic: topic || "general",
      });
      if (error) throw error;
      setSaved(true);
      toast({ title: "Material saved!" });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(`${generated.title}\n\n${generated.content}`);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Material Generator</h1>
        <p className="text-muted-foreground mt-1">Create exercises, readings, and practice materials with AI</p>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Material Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white/10 border-white/20 rounded-xl"><SelectValue placeholder="Choose type..." /></SelectTrigger>
              <SelectContent>
                {materialTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Level</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-white/10 border-white/20 rounded-xl"><SelectValue placeholder="Level..." /></SelectTrigger>
              <SelectContent>
                {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Topic / Grammar Focus</label>
            <Input placeholder="e.g. prepositions of place" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-white/10 border-white/20 rounded-xl" />
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={!type || !level || generating} className="mt-4 gap-2 rounded-xl">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating..." : "Generate Material"}
        </Button>
      </GlassCard>

      {generated && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-display">{generated.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" className="rounded-xl gap-1" onClick={handleSave} disabled={saved}>
                {saved && <Check className="h-3.5 w-3.5" />}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
          <p className="text-sm whitespace-pre-line">{generated.content}</p>
        </GlassCard>
      )}
    </div>
  );
}
