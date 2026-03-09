import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, FileUp, FileText, X } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Use the bundled worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

interface ImportLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function ImportLessonsDialog({ open, onOpenChange, studentId, studentName }: ImportLessonsDialogProps) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
      setFile(f);
      setIsExtracting(true);
      try {
        const extracted = await extractTextFromPdf(f);
        setText(extracted);
        toast.success("Texto extraído del PDF correctamente");
      } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error("No se pudo leer el PDF. Probá pegando el texto manualmente.");
        setFile(null);
      } finally {
        setIsExtracting(false);
      }
      return;
    }

    if (f.type === "text/plain" || f.name.endsWith(".txt") || f.name.endsWith(".md")) {
      const content = await f.text();
      setText(content);
      setFile(f);
      return;
    }

    toast.error("Formato no soportado. Usá PDF o .txt");
  };

  const removeFile = () => {
    setFile(null);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error("Subí un PDF o pegá el texto de las clases");
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

      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["grammar_topics"] });
      qc.invalidateQueries({ queryKey: ["vocabulary"] });
      qc.invalidateQueries({ queryKey: ["progress_notes"] });

      setText("");
      setFile(null);
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
            Subí el PDF de clases o pegá el texto. La IA extraerá lecciones, gramática, vocabulario y observaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subir PDF</Label>
            {file ? (
              <div className="flex items-center gap-3 border border-border rounded-xl p-4 bg-secondary/30">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isExtracting ? "Extrayendo texto..." : `${(file.size / 1024).toFixed(0)} KB — texto extraído ✓`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="shrink-0" disabled={isExtracting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Hacé clic para subir un PDF</p>
                <p className="text-xs text-muted-foreground mt-1">El texto se extrae automáticamente en tu navegador</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {text && (
            <div className="space-y-2">
              <Label htmlFor="lessons-text">Texto extraído (podés editarlo)</Label>
              <Textarea
                id="lessons-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}

          {!file && !text && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">o pegá el texto directamente</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pegá acá el contenido del historial de clases..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isParsing || isExtracting || !text.trim()} className="gap-2">
            {isParsing ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando con IA...</> : "Importar con IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
