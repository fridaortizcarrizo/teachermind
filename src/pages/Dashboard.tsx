import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { students, lessons, lessonBlocks, smartSuggestions } from "@/data/mock-data";
import { Users, BookOpen, Layers, Sparkles, Calendar, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

const suggestionIcons = {
  grammar: Sparkles,
  speaking: BookOpen,
  review: AlertTriangle,
  warning: AlertTriangle,
  tip: Lightbulb,
};

const suggestionColors = {
  high: "border-l-4 border-l-destructive",
  medium: "border-l-4 border-l-accent",
  low: "border-l-4 border-l-muted-foreground",
};

export default function Dashboard() {
  const upcomingLessons = lessons.filter((l) => l.status === "planned").slice(0, 3);
  const recentStudents = students.slice(0, 3);
  const activeBlocks = lessonBlocks.filter((b) => b.status === "active");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your teaching overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students" value={students.length} subtitle="Active" icon={Users} />
        <StatCard title="Lessons" value={lessons.length} subtitle="Total recorded" icon={BookOpen} />
        <StatCard title="Active Blocks" value={activeBlocks.length} subtitle="In progress" icon={Layers} />
        <StatCard title="Upcoming" value={upcomingLessons.length} subtitle="Planned classes" icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Upcoming Lessons</h2>
            <Link to="/generate-lesson">
              <Button className="gap-2 rounded-xl">
                <Sparkles className="h-4 w-4" />
                Generate Lesson
              </Button>
            </Link>
          </div>
          {upcomingLessons.map((lesson) => {
            const student = students.find((s) => s.id === lesson.studentId);
            return (
              <GlassCard key={lesson.id} className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{lesson.title}</p>
                    {student && <GlassBadge level={student.level} variant="level" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{student?.name} · {lesson.date}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lesson.grammarFocus.join(", ")}</p>
                </div>
              </GlassCard>
            );
          })}
          {upcomingLessons.length === 0 && (
            <GlassCard variant="subtle" className="text-center py-8">
              <p className="text-muted-foreground">No upcoming lessons. Generate one!</p>
            </GlassCard>
          )}
        </div>

        {/* Smart Suggestions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">Smart Suggestions</h2>
          {smartSuggestions.slice(0, 4).map((s) => {
            const Icon = suggestionIcons[s.type];
            const student = students.find((st) => st.id === s.studentId);
            return (
              <GlassCard key={s.id} variant="subtle" className={`py-4 ${suggestionColors[s.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <div>
                    {student && <p className="text-xs font-medium text-primary mb-1">{student.name}</p>}
                    <p className="text-sm text-foreground">{s.message}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Recent Students */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Recent Students</h2>
          <Link to="/students" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentStudents.map((student) => {
            const studentLessons = lessons.filter((l) => l.studentId === student.id);
            const block = lessonBlocks.find((b) => b.studentId === student.id && b.status === "active");
            return (
              <Link key={student.id} to={`/students/${student.id}`}>
                <GlassCard className="hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.profession}</p>
                    </div>
                    <GlassBadge level={student.level} variant="level" className="ml-auto" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{studentLessons.length} lessons</span>
                    {block && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{block.lessonsCompleted}/{block.size} block</span>}
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
