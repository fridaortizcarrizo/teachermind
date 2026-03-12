import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Loader2, Sparkles, BookOpen, CheckCircle2,
  Edit3, Save, RotateCcw, Copy, Check, History, X, Printer, FileText, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudents } from "@/hooks/useStudents";
import { useCreateLesson, useLessons } from "@/hooks/useLessons";
import { useActiveBlock } from "@/hooks/useLessonBlocks";
import { useLessonDrafts, useAutoSaveDraft, useDeleteDraft, type LessonDraftRow } from "@/hooks/useLessonDrafts";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };

type LessonDraft = {
  title: string;
  studentName: string;
  date: string;
  level: string;
  objective: string;
  grammarFocus: string[];
  vocabularyFocus: string[];
  homeworkReview: string;
  grammarExplanation: string;
  vocabularySection: string;
  coreExercise: string;
  derivedExercise1: string;
  derivedExercise2: string;
  derivedExercise3: string;
  derivedExercise4: string;
  derivedExercise5: string;
  derivedExercise6: string;
  speakingTask1: string;
  speakingTask2: string;
  homework: string;
  teacherNotes: string;
};

type SectionKey = keyof LessonDraft;

type EditState = {
  sectionKey: SectionKey;
  instruction: string;
  isLoading: boolean;
};

// ─── Section metadata ─────────────────────────────────────────────────────────

const SECTION_META: Record<SectionKey, { label: string; group: string; printable: boolean }> = {
  title:              { label: "Título",                    group: "meta",      printable: false },
  studentName:        { label: "Alumna",                    group: "meta",      printable: false },
  date:               { label: "Fecha",                     group: "meta",      printable: false },
  level:              { label: "Nivel",                     group: "meta",      printable: false },
  objective:          { label: "Objetivo",                  group: "meta",      printable: false },
  grammarFocus:       { label: "Gramática (tags)",          group: "meta",      printable: false },
  vocabularyFocus:    { label: "Vocabulario (tags)",        group: "meta",      printable: false },
  homeworkReview:     { label: "1 · Revisión de tarea",     group: "homework",  printable: true  },
  grammarExplanation: { label: "2a · Gramática",            group: "theory",    printable: true  },
  vocabularySection:  { label: "2b · Vocabulario",          group: "theory",    printable: true  },
  coreExercise:       { label: "3 · Ejercicio troncal",     group: "core",      printable: true  },
  derivedExercise1:   { label: "4a · Ejercicio derivado 1", group: "derived",   printable: true  },
  derivedExercise2:   { label: "4b · Ejercicio derivado 2", group: "derived",   printable: true  },
  derivedExercise3:   { label: "4c · Ejercicio derivado 3", group: "derived",   printable: true  },
  derivedExercise4:   { label: "4d · Ejercicio derivado 4", group: "derived",   printable: true  },
  derivedExercise5:   { label: "4e · Ejercicio derivado 5", group: "derived",   printable: true  },
  derivedExercise6:   { label: "4f · Ejercicio derivado 6", group: "derived",   printable: true  },
  speakingTask1:      { label: "5a · Speaking 1",           group: "speaking",  printable: true  },
  speakingTask2:      { label: "5b · Speaking 2",           group: "speaking",  printable: true  },
  homework:           { label: "6 · Tarea",                 group: "homework2", printable: true  },
  teacherNotes:       { label: "📋 Notas para la profe",    group: "notes",     printable: false },
};

const SECTION_ORDER: SectionKey[] = [
  "homeworkReview",
  "grammarExplanation", "vocabularySection",
  "coreExercise",
  "derivedExercise1", "derivedExercise2", "derivedExercise3",
  "derivedExercise4", "derivedExercise5", "derivedExercise6",
  "speakingTask1", "speakingTask2",
  "homework",
  "teacherNotes",
];

const GROUP_COLORS: Record<string, string> = {
  homework:  "border-l-amber-400",
  theory:    "border-l-blue-400",
  core:      "border-l-violet-400",
  derived:   "border-l-emerald-400",
  speaking:  "border-l-rose-400",
  homework2: "border-l-orange-400",
  notes:     "border-l-gray-400",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
const AUTH_HEADER = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

const SYSTEM_PROMPT = `Sos TeacherMind, asistente de una profesora de inglés en Argentina. Tu trabajo es generar planes de clase COMPLETOS y LISTOS PARA FOTOCOPIAR, con todos los ejercicios escritos de principio a fin.

═══════════════════════════════════════════
FASE 1 — RECOPILACIÓN
═══════════════════════════════════════════
Hacé preguntas de a UNA por vez, en español, de forma amigable. Necesitás:
1. Para qué alumna es la clase
2. Nivel de la alumna (A1–C2) — si no lo sabés, preguntá
3. Tema de gramática y/o vocabulario a trabajar
4. Si hay tarea anterior para revisar (si hay clase anterior seleccionada en el contexto, ya lo sabés)
5. Tipo de ejercicio troncal: reading, listening, o ambos

Si el contexto incluye "CLASE ANTERIOR SELECCIONADA", ya conocés la tarea pendiente y el nivel — no volvás a preguntar eso.

Cuando tengas suficiente info, generá el plan.

═══════════════════════════════════════════
FASE 2 — GENERACIÓN
═══════════════════════════════════════════
Respondé ÚNICAMENTE con JSON válido (sin texto antes/después, sin backticks):
{
  "draft": {
    "title": "Título creativo de la clase",
    "studentName": "Nombre de la alumna",
    "date": "fecha hoy dd/mm/yyyy",
    "level": "B1",
    "objective": "Al finalizar esta clase, la alumna podrá...",
    "grammarFocus": ["Present Continuous", "Stative verbs"],
    "vocabularyFocus": ["blueprint", "renovate", "scaffolding"],
    "homeworkReview": "REVISIÓN DE TAREA ANTERIOR\\n\\nCorrection activity:\\n1. [ejercicio completo de corrección]\\n\\nFollow-up activity:\\n[ejercicio interactivo de 3-5 ítems]",
    "grammarExplanation": "GRAMÁTICA: [TEMA]\\n\\nExplicación:\\n[explicación clara con ejemplos y tabla]\\n\\nEjemplos:\\n• [ejemplo 1]\\n• [ejemplo 2]\\n\\nCommon mistakes:\\n• [error] → [corrección]",
    "vocabularySection": "VOCABULARIO\\n\\nPalabras clave:\\n1. [word] – [definition]. E.g.: [example]\\n2. ...",
    "coreExercise": "EJERCICIO TRONCAL: [READING/LISTENING]\\n\\n[texto completo mínimo 150 palabras]\\n\\nComprehension questions:\\n1. [pregunta]\\n2. ...",
    "derivedExercise1": "EJERCICIO DERIVADO 1: Vocabulary in context\\n\\n[ejercicio completo con todos los ítems]",
    "derivedExercise2": "EJERCICIO DERIVADO 2: Grammar focus\\n\\n[ejercicio completo]",
    "derivedExercise3": "EJERCICIO DERIVADO 3: True / False / Not Given\\n\\n[5-6 oraciones]",
    "derivedExercise4": "EJERCICIO DERIVADO 4: Sentence transformation\\n\\n[transformaciones]",
    "derivedExercise5": "EJERCICIO DERIVADO 5: Write your own\\n\\n[producción escrita]",
    "derivedExercise6": "EJERCICIO DERIVADO 6: Discussion prep\\n\\n[preguntas preparatorias]",
    "speakingTask1": "SPEAKING 1: [actividad]\\n\\nInstrucciones para la alumna:\\n[...]\\n\\nGuía para la profe:\\n[...]",
    "speakingTask2": "SPEAKING 2: Free conversation\\n\\n[preguntas disparadoras]",
    "homework": "TAREA PARA LA PRÓXIMA CLASE\\n\\n[tarea completa, 15-20 min]",
    "teacherNotes": "NOTAS PARA LA PROFE\\n\\n• Timing sugerido\\n• Posibles dificultades\\n• Si termina antes: [extra]"
  }
}

═══════════════════════════════════════════
FASE 3 — EDICIÓN DE SECCIÓN
═══════════════════════════════════════════
Cuando el usuario pide editar una sección, respondé ÚNICAMENTE con:
{
  "edit": {
    "sectionKey": "nombre exacto de la clave",
    "value": "contenido nuevo completo de esa sección"
  }
}

REGLAS IMPORTANTES:
- Cada sección debe estar COMPLETA y lista para imprimir
- Los ejercicios deben tener todos los ítems escritos
- Usá \\n para saltos de línea dentro de los strings JSON
- Nunca mezcles texto libre con JSON
`;

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
      const line = buffer.slice(0, nl).replace(/\r$/, "");
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
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey, draft, onEdit, isEditing,
}: {
  sectionKey: SectionKey;
  draft: LessonDraft;
  onEdit: (key: SectionKey) => void;
  isEditing: boolean;
}) {
  const value = draft[sectionKey];
  const isArray = Array.isArray(value);
  const isEmpty = isArray ? (value as string[]).length === 0 : !value;
  const meta = SECTION_META[sectionKey];
  const colorClass = GROUP_COLORS[meta.group] ?? "border-l-gray-300";

  return (
    <div
      className={`group relative rounded-xl border border-border/60 bg-card border-l-4 ${colorClass} transition-all hover:shadow-sm ${isEditing ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {meta.label}
        </p>
        <button
          onClick={() => onEdit(sectionKey)}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary"
          title="Editar con IA"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-4 pb-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground italic">Sin contenido</p>
        ) : isArray ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(value as string[]).map((v, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {v}
              </span>
            ))}
          </div>
        ) : (
          <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {String(value)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── Lesson header ────────────────────────────────────────────────────────────

function LessonHeader({ draft, saveDate, onDateChange }: { draft: LessonDraft; saveDate: string; onDateChange: (d: string) => void }) {
  return (
    <div className="rounded-xl border border-border/60 bg-primary/5 p-4 mb-2">
      <h2 className="text-lg font-bold text-foreground">{draft.title}</h2>
      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
        <span>👤 {draft.studentName}</span>
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          <input
            type="date"
            value={saveDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent border-b border-dashed border-muted-foreground/40 text-sm text-foreground focus:outline-none focus:border-primary px-1"
          />
        </span>
        <span>🎯 {draft.level}</span>
      </div>
      <p className="mt-2 text-sm text-foreground/80 italic">{draft.objective}</p>
      {draft.grammarFocus?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {draft.grammarFocus.map((t, i) => (
            <span key={i} className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 text-xs font-medium">{t}</span>
          ))}
          {draft.vocabularyFocus?.map((t, i) => (
            <span key={`v${i}`} className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">{t}</span>
          ))}
        </div>
      )}
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
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <History className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 truncate">{selected.title}</p>
            <p className="text-[10px] text-amber-600/80">
              {new Date(selected.date).toLocaleDateString("es-AR")}
              {(selected.grammar_focus ?? []).length > 0 && ` · ${selected.grammar_focus.slice(0, 2).join(", ")}`}
              {selected.homework && " · tarea pendiente ✓"}
            </p>
          </div>
          <button onClick={() => onSelect(null)} className="text-amber-500 hover:text-amber-700 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
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

// ─── Draft Resume Card ────────────────────────────────────────────────────────

function DraftResumeCard({ draft, onResume, onDiscard }: {
  draft: LessonDraftRow;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const draftData = draft.draft_json as LessonDraft | null;
  const updatedAt = new Date(draft.updated_at).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-900/20 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-amber-600" />
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Borrador sin guardar</p>
      </div>
      {draftData?.title && (
        <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
          {draftData.title} — {draftData.studentName}
        </p>
      )}
      <p className="text-[10px] text-amber-600/70">Última edición: {updatedAt}</p>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onResume} className="rounded-lg text-xs gap-1.5">
          <RotateCcw className="h-3 w-3" /> Retomar
        </Button>
        <Button size="sm" variant="outline" onClick={onDiscard} className="rounded-lg text-xs">
          Descartar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LessonGenerator() {
  const { user } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: allLessons = [] } = useLessons();
  const createLesson = useCreateLesson?.();
  const { data: existingDrafts = [] } = useLessonDrafts();
  const deleteDraft = useDeleteDraft();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveDate, setSaveDate] = useState(todayStr());
  const [dismissedDraftId, setDismissedDraftId] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPrevLessonId, setSelectedPrevLessonId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Auto-save
  const { setDraftId, clearDraft } = useAutoSaveDraft({
    draft,
    messages,
    studentId: selectedStudentId,
    selectedPrevLessonId,
    enabled: !!user && (messages.length > 0 || draft !== null) && !saved,
  });

  // Find active block for selected student
  const studentForBlock = draft
    ? students.find((s) => s.name.toLowerCase().includes(draft.studentName.toLowerCase()))
    : students.find((s) => s.id === selectedStudentId);
  const activeBlock = useActiveBlock(studentForBlock?.id);

  // Resumable draft (show the most recent one if chat hasn't started)
  const resumableDraft = existingDrafts.length > 0 && messages.length === 0 && !draft && dismissedDraftId !== existingDrafts[0]?.id
    ? existingDrafts[0]
    : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (editState && editInputRef.current) editInputRef.current.focus();
  }, [editState]);

  const buildContext = () => {
    const studentsSummary = students
      .map((s) => `${s.name} (Nivel: ${s.level}, Ocupación: ${s.profession ?? "—"}, Objetivos: ${(s.objectives ?? []).join(", ")}, Dificultades: ${(s.difficulties ?? []).join(", ")}, Intereses: ${(s.interests ?? []).join(", ")})`)
      .join("\n");

    let prevContext = "";
    if (selectedPrevLessonId) {
      const prev = allLessons.find((l) => l.id === selectedPrevLessonId);
      if (prev) {
        prevContext = `\n\nCLASE ANTERIOR SELECCIONADA:\n- Título: ${prev.title}\n- Fecha: ${prev.date}\n- Gramática trabajada: ${(prev.grammar_focus ?? []).join(", ") || "—"}\n- Vocabulario: ${(prev.vocabulary_focus ?? []).join(", ") || "—"}\n- Tarea pendiente: ${prev.homework ?? "sin tarea"}\n- Observaciones: ${prev.observations ?? "—"}`;
      }
    }
    return `Alumnos:\n${studentsSummary}${prevContext}\n\nFecha de hoy: ${new Date().toLocaleDateString("es-AR")}`;
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
        setSaveDate(todayStr()); // Always default to today
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: `✅ ¡Clase lista! Generé el plan completo para **${parsedDraft.studentName}**. Está todo desglosado a la derecha, listo para imprimir. Hacé hover sobre cualquier sección y click en ✏️ para editar algo puntual. ¿Ajustamos algo?`,
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

    const meta = SECTION_META[editState.sectionKey];
    const currentValue = draft ? renderValue(editState.sectionKey, draft[editState.sectionKey]) : "";
    const editPrompt = `Editar sección "${meta.label}" (clave: "${editState.sectionKey}"). Contenido actual:\n"""${currentValue}"""\nInstrucción: ${editState.instruction}\nRespondé ÚNICAMENTE con el JSON de edición.`;

    try {
      const result = await streamChat([...messages, { role: "user", content: editPrompt }], buildContext(), () => {});
      const parsed = tryParseEdit(result);
      if (parsed && draft) {
        setDraft((prev) => prev ? { ...prev, [parsed.sectionKey]: parsed.value } : prev);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `Editar "${meta.label}": ${editState.instruction}` },
          { role: "assistant", content: `✏️ **${meta.label}** actualizado.` },
        ]);
        toast.success(`"${meta.label}" actualizado`);
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
      const student = students.find((s) => s.name.toLowerCase().includes(draft.studentName.toLowerCase()));
      if (!student) { toast.error(`No encontré "${draft.studentName}".`); setIsSaving(false); return; }

      // Use the date picker value (defaults to today), NOT the AI-generated date
      const dateStr = saveDate || todayStr();

      await createLesson.mutateAsync({
        student_id: student.id,
        title: draft.title,
        date: dateStr,
        objective: draft.objective,
        grammar_focus: draft.grammarFocus,
        vocabulary_focus: draft.vocabularyFocus,
        warm_up: draft.homeworkReview,
        homework_check: draft.homeworkReview,
        grammar_explanation: draft.grammarExplanation,
        exercises: [
          draft.coreExercise,
          draft.derivedExercise1, draft.derivedExercise2, draft.derivedExercise3,
          draft.derivedExercise4, draft.derivedExercise5, draft.derivedExercise6,
        ].filter(Boolean),
        speaking_task: [draft.speakingTask1, draft.speakingTask2].filter(Boolean).join("\n\n---\n\n"),
        homework: draft.homework,
        observations: draft.teacherNotes,
        status: "planned",
        block_id: activeBlock?.id ?? null,
      } as any);

      // Delete the draft from DB
      await clearDraft();

      // Invalidate all relevant queries so calendar, student profile, etc. update
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson_blocks"] });
      queryClient.invalidateQueries({ queryKey: ["block_lesson_counts"] });
      queryClient.invalidateQueries({ queryKey: ["lesson_drafts"] });

      toast.success("Clase guardada ✓ — aparecerá en el calendario y perfil de la alumna");
      setSaved(true);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      draft.title,
      `${draft.studentName} · ${saveDate} · ${draft.level}`,
      `Objetivo: ${draft.objective}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      "",
      ...SECTION_ORDER
        .filter((k) => SECTION_META[k].printable && draft[k])
        .map((k) => `${SECTION_META[k].label.toUpperCase()}\n${"─".repeat(30)}\n${renderValue(k, draft[k])}\n`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Clase copiada al portapapeles");
  };

  const resetAll = async () => {
    await clearDraft();
    setMessages([]); setDraft(null); setEditState(null);
    setSaved(false); setSelectedStudentId(null); setSelectedPrevLessonId(null);
    setSaveDate(todayStr()); setDismissedDraftId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resumeDraft = (row: LessonDraftRow) => {
    setDraftId(row.id);
    const chatMsgs = (row.chat_messages ?? []) as Msg[];
    const draftData = row.draft_json as LessonDraft | null;
    setMessages(chatMsgs);
    if (draftData && draftData.title) setDraft(draftData);
    if (row.student_id) setSelectedStudentId(row.student_id);
    if (row.selected_prev_lesson_id) setSelectedPrevLessonId(row.selected_prev_lesson_id);
    toast.success("Borrador retomado");
  };

  const discardDraft = async (row: LessonDraftRow) => {
    try {
      await deleteDraft.mutateAsync(row.id);
      setDismissedDraftId(row.id);
      toast.success("Borrador descartado");
    } catch {
      toast.error("Error al descartar");
    }
  };

  const hasDraft = draft !== null;
  const chatStarted = messages.length > 0;
  const prevLesson = allLessons.find((l) => l.id === selectedPrevLessonId);

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] gap-0 rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-background">
      {/* ── LEFT: Chat ── */}
      <div className={`flex flex-col transition-all duration-300 ${hasDraft ? "w-[36%]" : "w-full"} border-r border-border/50`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-primary/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Lesson Generator</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Chat con IA · auto-guardado</p>
            </div>
          </div>
          {chatStarted && (
            <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted">
              <RotateCcw className="h-3 w-3" /> Nueva clase
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Empty state */}
          {!chatStarted && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">Generador de clases</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Te genero la clase completa, lista para imprimir.
                </p>
              </div>

              {/* Resume draft card */}
              {resumableDraft && (
                <DraftResumeCard
                  draft={resumableDraft}
                  onResume={() => resumeDraft(resumableDraft)}
                  onDiscard={() => discardDraft(resumableDraft)}
                />
              )}

              {students.length > 0 && (
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">Elegí una alumna:</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {students.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id === selectedStudentId ? null : s.id)}
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

              <button
                onClick={() => {
                  const student = students.find((s) => s.id === selectedStudentId);
                  send(student
                    ? `Quiero crear un plan de clase para ${student.name}`
                    : "Quiero crear un plan de clase"
                  );
                }}
                className="mt-1 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Empezar →
              </button>
            </div>
          )}

          {/* Context badge */}
          {chatStarted && prevLesson && (
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-[11px] text-amber-700 dark:text-amber-400">
                <History className="h-3 w-3" />
                Contexto: &quot;{prevLesson.title}&quot;
                <button onClick={() => setSelectedPrevLessonId(null)} className="ml-1 hover:opacity-70">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
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

        {/* Input */}
        {chatStarted && (
          <div className="p-3 border-t border-border/50 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={isStreaming ? "Generando..." : "Escribí tu mensaje..."}
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

      {/* ── RIGHT: Full lesson draft ── */}
      {hasDraft && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Draft toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold truncate max-w-[220px]">{draft.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDraft}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                Copiar todo
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <Printer className="h-3 w-3" /> Imprimir
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
                  : <><Save className="h-3.5 w-3.5" />Guardar</>}
              </Button>
            </div>
          </div>

          {/* Edit banner */}
          {editState && (
            <div className="mx-4 mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-primary">
                  Editando: {SECTION_META[editState.sectionKey].label}
                </p>
                <button onClick={() => setEditState(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">cancelar</button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={editInputRef}
                  value={editState.instruction}
                  onChange={(e) => setEditState((s) => s ? { ...s, instruction: e.target.value } : s)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendEdit(); if (e.key === "Escape") setEditState(null); }}
                  placeholder="Ej: hacelo más corto, cambiá el tema a tecnología, agregá más ítems..."
                  className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                  disabled={editState.isLoading}
                />
                <Button onClick={sendEdit} disabled={!editState.instruction.trim() || editState.isLoading} size="sm" className="rounded-lg">
                  {editState.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            </div>
          )}

          {/* Lesson content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <LessonHeader draft={draft} saveDate={saveDate} onDateChange={setSaveDate} />

            {SECTION_ORDER.map((key) => (
              <SectionCard
                key={key}
                sectionKey={key}
                draft={draft}
                onEdit={(k) => setEditState({ sectionKey: k, instruction: "", isLoading: false })}
                isEditing={editState?.sectionKey === key}
              />
            ))}
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
