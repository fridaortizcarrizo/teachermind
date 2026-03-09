import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/useStudents";
import { useLessons } from "@/hooks/useLessons";
import { useLessonBlocks } from "@/hooks/useLessonBlocks";
import { Users, BookOpen, Layers, Sparkles, Calendar, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: lessons = [], isLoading: loadingLessons } = useLessons();
  const { data: lessonBlocks = [] } = useLessonBlocks();

  const upcomingLessons = lessons.filter((l) => l.status === "planned").slice(0, 3);
  const recentStudents = students.slice(0, 3);
  const activeBlocks = lessonBlocks.filter((b) => b.status === "active");
  const isLoading = loadingStudents || loadingLessons;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your teaching overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students" value={students.length} subtitle="Active" icon={Users} />
        <StatCard title="Lessons" value={lessons.length} subtitle="Total recorded" icon={BookOpen} />
        <StatCard title="Active Blocks" value={activeBlocks.length} subtitle="In progress" icon={Layers} />
        <StatCard title="Upcoming" value={upcomingLessons.length} subtitle="Planned classes" icon={Calendar} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">Upcoming Lessons</h2>
              <Link to="/generate-lesson">
                <Button className="gap-2 rounded-xl"><Sparkles className="h-4 w-4" />Generate Lesson</Button>
              </Link>
            </div>
            {upcomingLessons.map((lesson) => {
              const student = students.find((s) => s.id === lesson.student_id);
              return (
                <GlassCard key={lesson.id} className="flex items-center gap-4">
                  <div className="rounded-xl bg-primary/10 p-3"><Calendar className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{lesson.title}</p>
                      {student && <GlassBadge level={student.level} variant="level" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{student?.name} · {lesson.date}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(lesson.grammar_focus ?? []).join(", ")}</p>
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

          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display">Quick Info</h2>
            <GlassCard variant="subtle" className="py-4">
              <p className="text-sm text-muted-foreground">
                {students.length} students · {lessons.filter(l => l.status === 'completed').length} completed lessons
              </p>
            </GlassCard>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Recent Students</h2>
          <Link to="/students" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentStudents.map((student) => {
            const studentLessons = lessons.filter((l) => l.student_id === student.id);
            const block = lessonBlocks.find((b) => b.student_id === student.id && b.status === "active");
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
                    {block && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{block.lessons_completed}/{block.size} block</span>}
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
