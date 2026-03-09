import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { students, grammarTopics, vocabulary, progressNotes, lessons } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = ["hsl(15, 70%, 45%)", "hsl(20, 80%, 55%)", "hsl(30, 40%, 70%)", "hsl(18, 50%, 35%)"];

export default function ProgressTracking() {
  const [selectedStudent, setSelectedStudent] = useState(students[0].id);
  const student = students.find((s) => s.id === selectedStudent)!;
  const studentGrammar = grammarTopics.filter((g) => g.studentId === selectedStudent);
  const studentVocab = vocabulary.filter((v) => v.studentId === selectedStudent);
  const studentNotes = progressNotes.filter((n) => n.studentId === selectedStudent);
  const studentLessons = lessons.filter((l) => l.studentId === selectedStudent);

  const grammarData = studentGrammar.map((g) => ({
    name: g.topic,
    times: g.timesWorked,
    status: g.status,
  }));

  const vocabByStatus = [
    { name: "New", value: studentVocab.filter((v) => v.status === "new").length },
    { name: "Practicing", value: studentVocab.filter((v) => v.status === "practicing").length },
    { name: "Consolidated", value: studentVocab.filter((v) => v.status === "consolidated").length },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor student development over time</p>
        </div>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-lg">{student.name}</span>
        <GlassBadge level={student.level} variant="level" />
        <span className="text-sm text-muted-foreground">{studentLessons.length} lessons total</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-bold font-display mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Grammar Progress</h3>
          {grammarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grammarData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="times" fill="hsl(15, 70%, 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No grammar data yet</p>}
        </GlassCard>

        <GlassCard>
          <h3 className="font-bold font-display mb-4">Vocabulary Status</h3>
          {vocabByStatus.length > 0 ? (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={vocabByStatus} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {vocabByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {vocabByStatus.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No vocabulary data yet</p>}
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-bold font-display mb-4">Progress Notes</h3>
        <div className="space-y-3">
          {studentNotes.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${n.type === 'milestone' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-sky-500/20 text-sky-800'}`}>{n.type}</span>
              <div>
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
              </div>
            </div>
          ))}
          {studentNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No progress notes yet</p>}
        </div>
      </GlassCard>
    </div>
  );
}
