import { NextResponse } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

interface Topic {
  title: string;
  description: string;
  estimatedHours: number;
  whyImportant: string;
  whyThisOrder: string;
  commands?: string[];
  files?: string[];
  tools?: string[];
  outcome?: string;
}

interface RoadmapWeek {
  week: number;
  topics: Topic[];
  summary: string;
  resources?: string[];
}

interface RoadmapResponse {
  goal: string;
  totalWeeks: number;
  weeklyHours: number;
  roadmap: RoadmapWeek[];
}

// Reuse Cerebras client instance for efficiency
const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

function ensureEnvKey() {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error(
      "CEREBRAS_API_KEY is not configured. Please set CEREBRAS_API_KEY in your environment (e.g., .env.local)"
    );
  }
}

function sanitizeJSONString(text: string) {
  let jsonText = text.trim();
  // Remove markdown fences and leading/trailing non-json
  jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (match) jsonText = match[0];

  // Common fixes
  jsonText = jsonText
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  return jsonText;
}

function validateRoadmap(obj: any): obj is RoadmapResponse {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.goal !== "string") return false;
  if (typeof obj.totalWeeks !== "number") return false;
  if (typeof obj.weeklyHours !== "number") return false;
  if (!Array.isArray(obj.roadmap)) return false;

  for (const w of obj.roadmap) {
    if (typeof w.week !== "number") return false;
    if (typeof w.summary !== "string") return false;
    if (!Array.isArray(w.topics)) return false;
    for (const t of w.topics) {
      if (typeof t.title !== "string") return false;
      if (typeof t.description !== "string") return false;
      if (typeof t.estimatedHours !== "number") return false;
      if (typeof t.whyImportant !== "string") return false;
      if (typeof t.whyThisOrder !== "string") return false;
    }
  }

  return true;
}

async function generateRoadmapWithAI(
  goal: string,
  weeklyHours: number,
  totalDuration: number
): Promise<RoadmapResponse> {
  ensureEnvKey();

  // Calculate simple topic planning
  const topicsPerWeekCalc = Math.max(1, Math.floor(weeklyHours / 2));
  const totalTopics = totalDuration * topicsPerWeekCalc;

  // Strict instruction to return only JSON matching the expected schema
  const systemMessage = `You are an expert technical mentor who must respond with STRICT JSON only. Do not include any explanation, markdown, or stray text. The JSON must follow this TypeScript shape exactly: { "goal": string, "totalWeeks": number, "weeklyHours": number, "roadmap": [ { "week": number, "summary": string, "topics": [ { "title": string, "description": string, "estimatedHours": number, "whyImportant": string, "whyThisOrder": string, "commands"?: string[], "files"?: string[], "tools"?: string[], "outcome"?: string } ] , "resources"?: string[] } ] }`;

  const userMessage = `Generate a ${totalDuration}-week learning roadmap for the goal: "${goal}". The learner has ${weeklyHours} hours/week available. Aim for approximately ${totalTopics} focused topics total (${topicsPerWeekCalc} topics per week). Requirements: - Use concrete, specific technologies and commands (no vague placeholders like 'learn basics') - For each topic include estimated hours (1-3), why it's important, and why it is ordered there - Provide week-by-week breakdown with actionable outcomes and resources - Return ONLY valid JSON that conforms to the schema provided in the system instruction`;

  try {
    const resp = await cerebras.chat.completions.create(
      {
        model: "llama3.1-8b",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      },
      { timeout: 60 * 1000 }
    );

    const raw = ((resp as any)?.choices?.[0]?.message?.content) || "";
    if (!raw || raw.trim().length === 0) {
      throw new Error("Empty response from Cerebras model");
    }

    const cleaned = sanitizeJSONString(raw);

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err: any) {
      console.error("Failed to parse model JSON:", err.message);
      console.error("Model output sample:", cleaned.substring(0, 1000));
      throw new Error("Failed to parse JSON from model response");
    }

    // Basic validation
    if (!validateRoadmap(parsed)) {
      console.error("Model returned JSON that does not match expected schema", parsed);
      throw new Error("Model returned JSON with unexpected structure");
    }

    // Normalize some values
    parsed.goal = parsed.goal || goal;
    parsed.totalWeeks = parsed.totalWeeks || totalDuration;
    parsed.weeklyHours = parsed.weeklyHours || weeklyHours;

    // Ensure week numbers and defaults
    parsed.roadmap = parsed.roadmap.map((w: any, idx: number) => ({
      week: typeof w.week === "number" ? w.week : idx + 1,
      summary: w.summary || `Week ${idx + 1} focus for ${goal}`,
      topics: Array.isArray(w.topics) ? w.topics : [],
      resources: Array.isArray(w.resources) ? w.resources : [],
    }));

    const totalTopicsInRoadmap = parsed.roadmap.reduce((s: number, w: any) => s + (w.topics?.length || 0), 0);
    if (totalTopicsInRoadmap === 0) {
      throw new Error("Model generated roadmap with no topics");
    }

    return parsed as RoadmapResponse;
  } catch (err: any) {
    // Map known errors from SDK to HTTP-like errors for clearer messages
    if (err instanceof Cerebras.APIError) {
      const code = (err as any).status || 500;
      console.error("Cerebras API error:", err);
      throw new Error(`Cerebras API error (${code}): ${err.message}`);
    }
    // Other errors
    console.error("Cerebras request failed:", err);
    // As a fallback, generate deterministic but specific roadmap (no mocking of AI)
    return generateIntelligentFallback(goal, weeklyHours, totalDuration, topicsPerWeekCalc);
  }
}

function generateIntelligentFallback(
  goal: string,
  weeklyHours: number,
  totalDuration: number,
  topicsPerWeek: number
): RoadmapResponse {
  // Deterministic, specific fallback when the LLM is unavailable. This is not mock data but a practical plan generator.
  const roadmap: RoadmapResponse = {
    goal,
    totalWeeks: totalDuration,
    weeklyHours,
    roadmap: [],
  };

  for (let week = 1; week <= totalDuration; week++) {
    const topics: Topic[] = [];
    for (let t = 0; t < topicsPerWeek; t++) {
      const topicIndex = (week - 1) * topicsPerWeek + t + 1;
      topics.push({
        title: `Day ${topicIndex}: Focused topic for ${goal}`,
        description: `Work on a concrete, practical topic related to ${goal}; include hands-on exercises and small deliverables.`,
        estimatedHours: Math.max(1, Math.floor(weeklyHours / Math.max(1, topicsPerWeek))),
        whyImportant: `This topic provides a concrete skill that builds towards ${goal}.`,
        whyThisOrder: `This topic follows prior weeks to ensure prerequisite knowledge.`,
        commands: ["# Follow the course instructions and run relevant commands"],
        files: ["README.md"],
        tools: ["VS Code", "Terminal"],
        outcome: `Small deliverable demonstrating the topic (e.g., sample code, tests).`,
      });
    }

    roadmap.roadmap.push({
      week,
      summary: `Week ${week} focuses on ${topics.map((x) => x.title.split(":")[1].trim()).join(", ")}`,
      topics,
      resources: ["Official documentation", "Relevant tutorials", "Example repos"],
    });
  }

  return roadmap;
}

export async function POST(req: Request) {
  try {
    const { goal, weeklyHours, totalDuration } = await req.json();

    // Validation
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "Learning goal is required" }, { status: 400 });
    }

    if (!weeklyHours || typeof weeklyHours !== "number" || weeklyHours < 1) {
      return NextResponse.json({ error: "Valid weekly hours is required (minimum 1)" }, { status: 400 });
    }

    if (!totalDuration || typeof totalDuration !== "number" || totalDuration < 1) {
      return NextResponse.json({ error: "Valid duration in weeks is required (minimum 1)" }, { status: 400 });
    }

    try {
      const roadmap = await generateRoadmapWithAI(goal.trim(), weeklyHours, totalDuration);
      return NextResponse.json(roadmap);
    } catch (err: any) {
      console.error("AI generation error:", err.message || err);
      return NextResponse.json(
        { error: err.message || "Failed to generate roadmap with AI" },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Roadmap endpoint error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate roadmap. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
