import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data extraction assistant for an English teacher's student management app. 
Given raw text from a student questionnaire (Google Forms responses), extract structured data.

Return a JSON object using the extract_student_data tool with these fields:
- name (string, required)
- age (number or null)
- profession (string or null) 
- email (string or null)
- level (string: one of "A1","A2","B1","B2","C1","C2" - infer from context, default "A1")
- objectives (string array - reasons for studying, goals)
- interests (string array - hobbies, topics they enjoy)
- difficulties (string array - challenges with English)
- strengths (string array - things they're good at, teacher observations)
- notes (string - combine availability, class style preferences, things to avoid, online experience, and any extra context into a readable text block)

Be thorough in extracting ALL information. The text may be in Spanish.`;

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
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_student_data",
              description: "Extract structured student profile data from questionnaire responses.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: ["number", "null"] },
                  profession: { type: ["string", "null"] },
                  email: { type: ["string", "null"] },
                  level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
                  objectives: { type: "array", items: { type: "string" } },
                  interests: { type: "array", items: { type: "string" } },
                  difficulties: { type: "array", items: { type: "string" } },
                  strengths: { type: "array", items: { type: "string" } },
                  notes: { type: "string" },
                },
                required: ["name", "level", "objectives", "interests", "difficulties", "strengths", "notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_student_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const studentData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(studentData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-questionnaire error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
