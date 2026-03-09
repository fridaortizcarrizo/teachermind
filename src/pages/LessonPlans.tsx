import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Progress } from "@/components/ui/progress";
import { lessonBlocks, students } from "@/data/mock-data";
import { Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LessonPlans() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
          <p className="text-muted-foreground mt-1">Manage lesson blocks and long-term planning</p>
        </div>
        <Button className="gap-2 rounded-xl"><Layers className="h-4 w-4" />New Block</Button>
      </div>

      <div className="space-y-4">
        {lessonBlocks.map((block) => {
          const student = students.find((s) => s.id === block.studentId);
          const progress = (block.lessonsCompleted / block.size) * 100;
          return (
            <GlassCard key={block.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg font-display">{block.title}</h3>
                    {student && <GlassBadge level={student.level} variant="level" />}
                  </div>
                  {student && <p className="text-sm text-muted-foreground">{student.name}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${block.status === 'active' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                  {block.status}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{block.lessonsCompleted} / {block.size} lessons</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Objectives</p>
                <div className="flex flex-wrap gap-1">
                  {block.objectives.map((o) => (
                    <span key={o} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{o}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Started: {block.startDate}</span>
                {block.endDate && <span>· Ends: {block.endDate}</span>}
              </div>

              {/* Timeline visualization */}
              <div className="flex gap-1 mt-4">
                {Array.from({ length: block.size }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${i < block.lessonsCompleted ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
