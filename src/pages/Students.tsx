import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { students, lessons, lessonBlocks } from "@/data/mock-data";
import { BookOpen, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Students() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage your student profiles</p>
        </div>
        <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" />Add Student</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {students.map((student) => {
          const studentLessons = lessons.filter((l) => l.studentId === student.id);
          const block = lessonBlocks.find((b) => b.studentId === student.id && b.status === "active");
          return (
            <Link key={student.id} to={`/students/${student.id}`}>
              <GlassCard className="hover:bg-white/20 transition-all cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{student.name}</h3>
                      <GlassBadge level={student.level} variant="level" />
                    </div>
                    <p className="text-sm text-muted-foreground">{student.profession} · Age {student.age}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {student.interests.slice(0, 3).map((i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{i}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{studentLessons.length} lessons</span>
                      {block && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{block.lessonsCompleted}/{block.size} block</span>}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
