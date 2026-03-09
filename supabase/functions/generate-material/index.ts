import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typeLabels: Record<string, string> = {
  reading: "Reading Comprehension",
  listening: "Listening Exercise",
  grammar_drill: "Grammar Drill",
  speaking_prompt: "Speaking Prompt",
  vocabulary_task: "Vocabulary Task",
  fill_blanks: "Fill in the Blanks",
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  matching: "Matching Exercise",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, level, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeLabel = typeLabels[type] || type;

    const systemPrompt = `You are an expert ESL/EFL materials creator. You create high-quality, ready-to-use practice materials for English language students.

You MUST respond with valid JSON only, no markdown, no extra text. The JSON must have this exact structure:
{
  "title": "Material title",
  "content": "The full exercise content, using \\n for line breaks. Include clear instructions, numbered items, and an answer key at the end (preceded by ---\\n\\nAnswer Key:)"
}

Guidelines:
- Create materials appropriate for the specified CEFR level
- Include clear instructions at the top
- Use relevant, engaging content related to the topic
- Always include an answer key for self-correction
- For fill_blanks: provide a word box and numbered sentences
- For multiple_choice: provide 3-4 options per question (8-10 questions)
- For true_false: provide 8-10 statements
- For matching: provide two columns to match (8-10 items)
- For grammar_drill: progressive difficulty exercises
- For reading: a text passage followed by comprehension questions
- For speaking_prompt: discussion questions, role-plays, or debate topics
- For vocabulary_task: contextual exercises with the target vocabulary
- For listening: describe a listening scenario with pre/post activities`;

    const userPrompt = `Create a ${typeLabel} exercise for CEFR level ${level}.
Topic/Grammar focus: ${topic || "general English"}

Generate a complete, ready-to-use exercise.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    const material = JSON.parse(jsonStr);

    return new Response(JSON.stringify(material), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-material error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
