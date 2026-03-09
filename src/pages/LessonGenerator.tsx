import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { students } from "@/data/mock-data";
import { Sparkles, Loader2, BookOpen, MessageSquare, PenLine, Home } from "lucide-react";

const sectionIcons: Record<string, any> = {
  "Homework Check": Home,
  "Warm Up": MessageSquare,
  "Grammar Focus": BookOpen,
  "Exercises": PenLine,
  "Speaking Task": MessageSquare,
  "Homework": Home,
};

const mockGeneratedLesson = {
  title: "Comparing Present Simple & Continuous",
  sections: [
    { name: "Homework Check", content: "Review the 10 sentences about prepositions. Check for in/on/at accuracy. Discuss 2-3 errors together." },
    { name: "Warm Up", content: "Look at these two photos of an architecture studio. What do you see? What are the people doing? (5 min)" },
    { name: "Grammar Focus", content: "Present Simple vs Present Continuous\n\n• Present Simple: habits, routines, facts → \"I design buildings.\"\n• Present Continuous: now, temporary → \"I am designing a new facade.\"\n\nKey signals: always/usually/every day vs now/at the moment/currently" },
    { name: "Exercises", content: "1. Gap fill: Choose Simple or Continuous (8 sentences)\n2. Error correction: Find the mistake (6 sentences)\n3. Picture description: What does she do? vs What is she doing?" },
    { name: "Speaking Task", content: "Interview role-play: You are an architect being interviewed for a magazine.\n- What do you do? (routine)\n- What are you working on now? (current project)\n- What do you usually design? vs What are you designing this month?" },
    { name: "Homework", content: "Write a paragraph (80-100 words): Describe your typical week AND what you are doing differently this week. Use at least 5 Present Simple and 5 Present Continuous sentences." },
  ],
};

export default function LessonGenerator() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const student = students.find((s) => s.id === selectedStudent);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Generator</h1>
        <p className="text-muted-foreground mt-1">AI-powered lesson creation based on student profile and history</p>
      </div>

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="bg-white/10 border-white/20 rounded-xl">
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.level})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!selectedStudent || generating}
            className="gap-2 rounded-xl self-end"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Lesson"}
          </Button>
        </div>

        {student && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">{student.name}</span>
              <GlassBadge level={student.level} variant="level" />
              <span className="text-xs text-muted-foreground">{student.profession}</span>
            </div>
            <p className="text-xs text-muted-foreground">Difficulties: {student.difficulties.join(", ")}</p>
          </div>
        )}
      </GlassCard>

      {generated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">{mockGeneratedLesson.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl">Export PDF</Button>
              <Button variant="outline" size="sm" className="rounded-xl">Copy Text</Button>
              <Button size="sm" className="rounded-xl">Save Lesson</Button>
            </div>
          </div>
          {mockGeneratedLesson.sections.map((section) => {
            const Icon = sectionIcons[section.name] || BookOpen;
            return (
              <GlassCard key={section.name} variant="subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{section.name}</h3>
                </div>
                <p className="text-sm text-foreground whitespace-pre-line">{section.content}</p>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
