import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BookOpen, CheckCircle2, Edit3, Save, RotateCcw, Copy, Check, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/useStudents";
import { useCreateLesson, useLessons } from "@/hooks/useLessons";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };

type LessonDraft = {
  title: string;
  studentName: string;
  date: string;
  objective: string;
  grammarFocus: string[];
  vocabularyFocus: string[];
  warmUp: string;
  homeworkCheck: string;
  grammarExplanation: string;
  exercises: string[];
  homework: string;
  observations: string;
};

type SectionKey = keyof LessonDraft;

type EditState = {
  sectionKey: SectionKey;
  instruction: string;
  isLoading: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
const AUTH_HEADER = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

const SECTION_LABELS: Record<SectionKey, string> = {
  title: "Título",
  studentName: "Alumna",
  date: "Fecha",
  objective: "Objetivo",
  grammarFocus: "Gramática",
  vocabularyFocus: "Vocabulario",
  warmUp: "Warm-up",
  homeworkCheck: "Revisión de tarea",
  grammarExplanation: "Explicación gramatical",
  exercises: "Ejercicios",
  homework: "Tarea",
  observations: "Observaciones",
};

const SECTION_ORDER: SectionKey[] = [
  "title", "studentName", "date", "objective",
  "grammarFocus", "vocabularyFocus",
  "warmUp", "homeworkCheck", "grammarExplanation",
  "exercises", "homework", "observations",
];

const SYSTEM_PROMPT = `Sos TeacherMind, un asistente para profesoras de inglés en Argentina. Tu trabajo es ayudar a crear planes de clase personalizados.

FASE 1 — RECOPILACIÓN (hasta que tengas suficiente info):
Hacé preguntas de a UNA por vez, en español, de forma conversacional y amigable. Necesitás saber:
1. Para qué alumna es la clase (nombre)
2. Qué tema de gramática o vocabulario querés trabajar
3. El nivel de la alumna (A1-C2)
4. Si hay algo específico para revisar o continuar de la clase anterior
5. Cualquier contexto extra relevante (intereses, objetivos, etc.)

Si en el contexto hay un bloque "CLASE ANTERIOR SELECCIONADA", usala para:
- Generar un homeworkCheck que revise la tarea que quedó pendiente
- Continuar desde el tema de gramática de esa clase
- Incorporar las observaciones para adaptar el nuevo plan
- NO preguntes cosas que ya podés inferir de esa clase anterior

Cuando tengas suficiente info (mínimo alumna + tema + nivel), generá el plan.

FASE 2 — GENERACIÓN DEL BORRADOR:
Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto antes ni después, sin backticks):
{
  "draft": {
    "title": "string — título creativo de la clase",
    "studentName": "string",
    "date": "string — fecha de hoy en formato dd/mm/yyyy",
    "objective": "string — objetivo claro en una oración",
    "grammarFocus": ["array", "de", "temas"],
    "vocabularyFocus": ["array", "de", "palabras"],
    "warmUp": "string — actividad de calentamiento de 5 min",
    "homeworkCheck": "string — cómo revisar la tarea anterior",
    "grammarExplanation": "string — explicación detallada del tema gramatical",
    "exercises": ["ejercicio 1", "ejercicio 2", "ejercicio 3"],
    "homework": "string — tarea para casa",
    "observations": "string — sugerencias y notas para la profe"
  }
}

FASE 3 — EDICIÓN:
Si el usuario pide editar una sección específica, respondé ÚNICAMENTE con un JSON:
{
  "edit": {
    "sectionKey": "nombre de la sección",
    "value": "nuevo contenido (string o array según corresponda)"
  }
}

Nunca mezcles texto libre con JSON. Si no estás en fase de generación, respondé en texto normal.`;

// ─── Streaming helper ─────────────────────────────────────────────────────────

async function streamChat(
  messages: Msg[],
  context: string,
  onChunk: (text: string) => void
): Promise<string> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
    body: JSON.stringify({ messages, context, system: SYSTEM_PROMPT }),
  });
  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl).replace(/\r$/, "");
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try {
        const chunk = JSON.parse(json)?.choices?.[0]?.delta?.content;
        if (chunk) { full += chunk; onChunk(full); }
      } catch { /* ignore */ }
    }
  }
  return full;
}

// ─── Parse helpers ────────────────────────────────────────────────────────────

function tryParseDraft(text: string): LessonDraft | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed?.draft) return parsed.draft as LessonDraft;
  } catch { }
  return null;
}

function tryParseEdit(text: string): { sectionKey: SectionKey; value: any } | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed?.edit) return parsed.edit;
  } catch { }
  return null;
}

function renderValue(key: SectionKey, value: any): string {
  if (Array.isArray(value)) return value.join(" · ");
  return String(value ?? "");
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ sectionKey, draft, onEdit }: {
  sectionKey: SectionKey;
  draft: LessonDraft;
  onEdit: (key: SectionKey) => void;
}) {
  const value = draft[sectionKey];
  const isArray = Array.isArray(value);
  const isEmpty = isArray ? (value as string[]).length === 0 : !value;
  if (["studentName", "date"].includes(sectionKey)) return null;

  return (
    <div className="group relative rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {SECTION_LABELS[sectionKey]}
          </p>
          {isEmpty ? (
            <p className="text-sm text-muted-foreground italic">Sin contenido</p>
          ) : isArray ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(value as string[]).map((v, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{v}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{String(value)}</p>
          )}
        </div>
        <button
          onClick={() => onEdit(sectionKey)}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary"
          title="Editar con IA"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Previous Lesson Picker ───────────────────────────────────────────────────

function PreviousLessonPicker({ studentId, selectedId, onSelect, lessons }: {
  studentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lessons: any[];
}) {
  const studentLessons = lessons
    .filter((l) => l.student_id === studentId && l.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (!studentId || studentLessons.length === 0) return null;

  const selected = studentLessons.find((l) => l.id === selectedId);

  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <History className="h-3 w-3" />
        Continuar desde una clase anterior <span className="opacity-60">(opcional)</span>
      </p>

      {selected ? (
        // Selected state — compact pill
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40 px-3 py-2">
          <History className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 truncate">{selected.title}</p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-500">
              {new Date(selected.date).toLocaleDateString("es-AR")}
              {(selected.grammar_focus ?? []).length > 0 && ` · ${selected.grammar_focus.slice(0, 2).join(", ")}`}
              {selected.homework && " · tarea pendiente ✓"}
            </p>
          </div>
          <button onClick={() => onSelect(null)} className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        // Dropdown list
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30 max-h-44 overflow-y-auto">
          {studentLessons.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{l.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(l.date).toLocaleDateString("es-AR")}
                  {(l.grammar_focus ?? []).length > 0 && ` · ${l.grammar_focus.slice(0, 2).join(", ")}`}
                </p>
              </div>
              {l.homework && (
                <span className="shrink-0 mt-0.5 text-[9px] rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 font-medium">
                  tarea
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LessonGenerator() {
  const { data: students = [] } = useStudents();
  const { data: allLessons = [] } = useLessons();
  const createLesson = useCreateLesson?.();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Previous lesson context
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPrevLessonId, setSelectedPrevLessonId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (editState && editInputRef.current) editInputRef.current.focus();
  }, [editState]);

  // Build context: all students + optional previous lesson details
  const buildContext = () => {
    const studentsSummary = students
      .map((s) => `${s.name} (Nivel: ${s.level}, Ocupación: ${s.profession ?? "—"}, Objetivos: ${(s.objectives ?? []).join(", ")}, Dificultades: ${(s.difficulties ?? []).join(", ")})`)
      .join("\n");

    let prevContext = "";
    if (selectedPrevLessonId) {
      const prev = allLessons.find((l) => l.id === selectedPrevLessonId);
      if (prev) {
        prevContext = `

CLASE ANTERIOR SELECCIONADA (usala como contexto para planificar la próxima clase):
- Título: ${prev.title}
- Fecha: ${prev.date}
- Objetivo: ${prev.objective ?? "—"}
- Gramática trabajada: ${(prev.grammar_focus ?? []).join(", ") || "—"}
- Vocabulario trabajado: ${(prev.vocabulary_focus ?? []).join(", ") || "—"}
- Tarea que quedó pendiente: ${prev.homework ?? "Sin tarea"}
- Observaciones de la clase: ${prev.observations ?? "Sin observaciones"}`;
      }
    }

    return `Alumnos:\n${studentsSummary}${prevContext}`;
  };

  const send = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isStreaming) return;

    const userMsg: Msg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const assistantContent = await streamChat(nextMessages, buildContext(), (partial) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: partial } : m);
          }
          return [...prev, { role: "assistant", content: partial }];
        });
      });

      const parsedDraft = tryParseDraft(assistantContent);
      if (parsedDraft) {
        setDraft(parsedDraft);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: `✅ ¡Borrador listo! Generé el plan para **${parsedDraft.studentName}** sobre **${parsedDraft.grammarFocus.join(", ")}**. Podés ver y editar cada sección a la derecha. ¿Querés ajustar algo?`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }]);
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendEdit = async () => {
    if (!editState || !editState.instruction.trim() || editState.isLoading) return;
    setEditState((s) => s ? { ...s, isLoading: true } : s);

    const sectionLabel = SECTION_LABELS[editState.sectionKey];
    const currentValue = draft ? renderValue(editState.sectionKey, draft[editState.sectionKey]) : "";
    const editPrompt = `Editar sección "${sectionLabel}". Contenido actual: "${currentValue}". Instrucción: ${editState.instruction}. Respondé ÚNICAMENTE con el JSON de edición.`;

    try {
      const result = await streamChat([...messages, { role: "user", content: editPrompt }], buildContext(), () => {});
      const parsed = tryParseEdit(result);
      if (parsed && draft) {
        setDraft((prev) => prev ? { ...prev, [parsed.sectionKey]: parsed.value } : prev);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `Editar "${sectionLabel}": ${editState.instruction}` },
          { role: "assistant", content: `✏️ Sección **${sectionLabel}** actualizada.` },
        ]);
        toast.success(`"${sectionLabel}" actualizado`);
      } else {
        toast.error("No se pudo aplicar la edición. Intentá de nuevo.");
      }
    } catch {
      toast.error("Error al editar.");
    } finally {
      setEditState(null);
    }
  };

  const saveLesson = async () => {
    if (!draft || !createLesson) return;
    setIsSaving(true);
    try {
      const student = students.find((s) =>
        s.name.toLowerCase().includes(draft.studentName.toLowerCase())
      );
      if (!student) { toast.error(`No encontré "${draft.studentName}" en tu lista.`); return; }

      let dateStr = new Date().toISOString().split("T")[0];
      try {
        const [d, m, y] = draft.date.split("/");
        if (d && m && y) dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } catch { }

      await createLesson.mutateAsync({
        student_id: student.id,
        title: draft.title, date: dateStr, objective: draft.objective,
        grammar_focus: draft.grammarFocus, vocabulary_focus: draft.vocabularyFocus,
        warm_up: draft.warmUp, homework_check: draft.homeworkCheck,
        grammar_explanation: draft.grammarExplanation, exercises: draft.exercises,
        homework: draft.homework, observations: draft.observations, status: "planned",
      } as any);

      toast.success("Clase guardada en el historial ✓");
      setSaved(true);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    const text = SECTION_ORDER
      .filter((k) => !["studentName", "date"].includes(k))
      .map((k) => `## ${SECTION_LABELS[k]}\n${renderValue(k, draft[k])}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedSection("all");
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success("Plan copiado al portapapeles");
  };

  const resetAll = () => {
    setMessages([]); setDraft(null); setEditState(null);
    setSaved(false); setSelectedStudentId(null); setSelectedPrevLessonId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startWithStudent = (student: any) => {
    setSelectedStudentId(student.id);
    send(`Quiero crear un plan de clase para ${student.name}`);
  };

  const hasDraft = draft !== null;
  const chatStarted = messages.length > 0;
  const prevLesson = allLessons.find((l) => l.id === selectedPrevLessonId);

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] gap-0 rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-background">

      {/* ── LEFT: Chat panel ── */}
      <div className={`flex flex-col transition-all duration-300 ${hasDraft ? "w-[38%]" : "w-full"} border-r border-border/50`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-primary/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Lesson Generator</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Chat con IA</p>
            </div>
          </div>
          {chatStarted && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" /> Nueva clase
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* ── Empty state ── */}
          {!chatStarted && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">¡Hola! Soy tu asistente de clases.</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Elegí una alumna para empezar, o escribí directamente.
                </p>
              </div>

              {/* Student chips */}
              {students.length > 0 && (
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">Elegí una alumna:</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {students.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          // Don't send yet — let user pick previous lesson first
                        }}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selectedStudentId === s.id
                            ? "bg-primary/10 border-primary/40 text-primary font-medium"
                            : "border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/40"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous lesson picker — appears after student selected */}
              {selectedStudentId && (
                <div className="w-full">
                  <PreviousLessonPicker
                    studentId={selectedStudentId}
                    selectedId={selectedPrevLessonId}
                    onSelect={setSelectedPrevLessonId}
                    lessons={allLessons}
                  />
                </div>
              )}

              {/* Start button */}
              <button
                onClick={() => {
                  const student = students.find((s) => s.id === selectedStudentId);
                  if (student) {
                    startWithStudent(student);
                  } else {
                    send("Quiero crear un plan de clase");
                  }
                }}
                className="mt-1 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Empezar →
              </button>
            </div>
          )}

          {/* Context badge shown in active chat */}
          {chatStarted && prevLesson && (
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40 px-3 py-1 text-[11px] text-amber-700 dark:text-amber-400">
                <History className="h-3 w-3" />
                Contexto: "{prevLesson.title}" · {new Date(prevLesson.date).toLocaleDateString("es-AR")}
                <button onClick={() => setSelectedPrevLessonId(null)} className="ml-1 hover:opacity-70">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ul]:mb-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input — only once chat started */}
        {chatStarted && (
          <div className="p-3 border-t border-border/50 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={isStreaming ? "Esperá la respuesta..." : "Escribí tu mensaje..."}
                disabled={isStreaming}
                className="flex-1 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
              />
              <Button onClick={() => send()} disabled={!input.trim() || isStreaming} size="icon" className="rounded-xl shrink-0">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Draft panel ── */}
      {hasDraft && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Draft header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-card shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none truncate max-w-[200px]">{draft.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{draft.studentName} · {draft.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDraft}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                {copiedSection === "all" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                Copiar
              </button>
              <Button
                onClick={saveLesson}
                disabled={isSaving || saved}
                size="sm"
                className="rounded-lg text-xs gap-1.5"
                variant={saved ? "outline" : "default"}
              >
                {saved
                  ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Guardado</>
                  : isSaving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando...</>
                  : <><Save className="h-3.5 w-3.5" />Guardar clase</>}
              </Button>
            </div>
          </div>

          {/* Edit banner */}
          {editState && (
            <div className="mx-4 mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-primary">Editando: {SECTION_LABELS[editState.sectionKey]}</p>
                <button onClick={() => setEditState(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">cancelar</button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={editInputRef}
                  value={editState.instruction}
                  onChange={(e) => setEditState((s) => s ? { ...s, instruction: e.target.value } : s)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendEdit(); if (e.key === "Escape") setEditState(null); }}
                  placeholder="Ej: hacelo más corto, agregá un ejemplo con arquitectura..."
                  className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                  disabled={editState.isLoading}
                />
                <Button
                  onClick={sendEdit}
                  disabled={!editState.instruction.trim() || editState.isLoading}
                  size="sm"
                  className="rounded-lg"
                >
                  {editState.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            </div>
          )}

          {/* Draft sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {SECTION_ORDER.map((key) => (
              <SectionCard
                key={key}
                sectionKey={key}
                draft={draft}
                onEdit={(k) => setEditState({ sectionKey: k, instruction: "", isLoading: false })}
              />
            ))}
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
