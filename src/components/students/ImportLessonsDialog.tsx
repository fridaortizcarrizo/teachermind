import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, FileUp, FileText } from "lucide-react";

interface ImportLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function ImportLessonsDialog({ open, onOpenChange, studentId, studentName }: ImportLessonsDialogProps) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const content = await file.text();
      setText(content);
      return;
    }

    // For PDFs, we read as text (basic extraction) or tell user to paste
    if (file.type === "application/pdf") {
      toast.info("Para PDFs, copiá el texto del documento y pegalo en el campo de abajo.");
      setFileName(null);
      return;
    }

    toast.error("Formato no soportado. Usá .txt o pegá el contenido directamente.");
    setFileName(null);
  };

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error("Pegá el contenido de las clases primero");
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lesson-pdf", {
        body: { studentId, pdfText: text.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imported = data.imported;
      const parts = [];
      if (imported.lessons > 0) parts.push(`${imported.lessons} clases`);
      if (imported.grammar_topics > 0) parts.push(`${imported.grammar_topics} temas de gramática`);
      if (imported.vocabulary > 0) parts.push(`${imported.vocabulary} palabras de vocabulario`);
      if (imported.progress_notes > 0) parts.push(`${imported.progress_notes} notas de progreso`);

      toast.success(`Importado para ${studentName}: ${parts.join(", ")}`);

      if (data.errors?.length > 0) {
        data.errors.forEach((e: string) => toast.warning(e));
      }

      // Invalidate all related queries
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["grammar_topics"] });
      qc.invalidateQueries({ queryKey: ["vocabulary"] });
      qc.invalidateQueries({ queryKey: ["progress_notes"] });

      setText("");
      setFileName(null);
      onOpenChange(false);
    } catch (e: any) {
      console.error("Import lessons error:", e);
      toast.error(e.message || "Error al importar historial de clases");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Importar historial de clases — {studentName}
          </DialogTitle>
          <DialogDescription>
            Pegá el contenido del PDF de clases y la IA extraerá lecciones, gramática, vocabulario y observaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subir archivo (opcional)</Label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {fileName ? fileName : "Hacé clic para subir un .txt, o pegá el texto abajo"}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessons-text">Contenido de las clases</Label>
            <Textarea
              id="lessons-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Pegá acá el contenido del PDF de historial de clases...\n\nEjemplo:\nLesson 1 — "This is Me"\nDate: 11/02/2025\nObjective: Introduce basic personal information...\nGrammar: Present Simple (to be)\n...`}
              rows={14}
              className="font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Copiá el texto completo del PDF y pegalo acá. La IA extraerá todas las clases, gramática, vocabulario y observaciones automáticamente.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isParsing || !text.trim()} className="gap-2">
            {isParsing ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</> : "Importar con IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
