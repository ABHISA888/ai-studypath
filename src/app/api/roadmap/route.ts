import { NextResponse } from "next/server";

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

async function generateRoadmapWithAI(
  goal: string,
  weeklyHours: number,
  totalDuration: number
): Promise<RoadmapResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "HUGGINGFACE_API_KEY is not configured. " +
      "Please create a .env.local file in the root directory with: HUGGINGFACE_API_KEY=your_key_here " +
      "Then restart your development server with 'npm run dev'"
    );
  }

  // Calculate topics per week (assuming ~2 hours per topic/day)
  const topicsPerWeekCalc = Math.max(1, Math.floor(weeklyHours / 2));
  const totalTopics = totalDuration * topicsPerWeekCalc;

  const systemPrompt = `You are an expert technical mentor and senior software engineer. Your task is to generate EXECUTION-READY, day-by-day learning roadmaps.

CRITICAL RULES:
- NEVER use vague terms like "Core Concepts", "Hands-on Practice", "Learn basics"
- EVERY topic must be concrete, technical, and actionable
- EVERY topic must include:
  1. Exact concepts (e.g., "Express middleware", not "backend basics")
  2. What to build (files, APIs, features)
  3. Commands or tools to use (npm, git, etc.)
  4. A clear outcome ("By the end, the user will have X")
- Topics should be sequenced logically with clear prerequisites
- Each topic should be 1-3 hours of focused work`;

  const userPrompt = `Generate a ${totalDuration}-week learning roadmap for the goal: "${goal}"

Requirements:
- ${weeklyHours} hours per week
- ${totalTopics} total learning topics
- Each week should have ${topicsPerWeekCalc} topics
- Each topic should be labeled as "Day X:" followed by specific, technical title
- Topics must be execution-ready with concrete steps

Generate a JSON response in this EXACT format:
{
  "goal": "${goal}",
  "totalWeeks": ${totalDuration},
  "weeklyHours": ${weeklyHours},
  "roadmap": [
    {
      "week": 1,
      "summary": "Brief 1-2 sentence summary of this week's focus",
      "topics": [
        {
          "title": "Day 1: [Specific Technical Topic]",
          "description": "Detailed description of exactly what to learn/build (2-3 sentences)",
          "estimatedHours": 2,
          "whyImportant": "Why this specific skill/concept matters in real-world context",
          "whyThisOrder": "Why this comes before other topics (prerequisites, logical flow)",
          "commands": ["exact command 1", "exact command 2"],
          "files": ["file1.js", "file2.json"],
          "tools": ["Tool Name 1", "Tool Name 2"],
          "outcome": "By the end, you will have X (specific, measurable outcome)"
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

  // Try multiple models in order of preference
  // Note: Some models may require accepting terms on Hugging Face first
  const models = [
    "mistralai/Mistral-7B-Instruct-v0.1",
    "HuggingFaceH4/zephyr-7b-beta",
    "google/flan-t5-xxl",
    "microsoft/DialoGPT-large",
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const modelEndpoint = `https://api-inference.huggingface.co/models/${modelName}`;
      
      // Format prompt based on model type
      let formattedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nCRITICAL: You must respond with ONLY valid JSON. No markdown, no explanations, no code blocks. Start directly with { and end with }.`;
      
      // Use instruction format for Mistral models
      if (modelName.includes("mistral") || modelName.includes("Mixtral")) {
        formattedPrompt = `<s>[INST] ${systemPrompt}\n\n${userPrompt}\n\nCRITICAL: You must respond with ONLY valid JSON. No markdown, no explanations, no code blocks. Start directly with { and end with }. [/INST]`;
      }

      const response = await fetch(modelEndpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 3000,
            temperature: 0.3,
            top_p: 0.9,
            return_full_text: false,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hugging Face API error for ${modelName}:`, response.status, errorText);
        
        // If model doesn't exist (410) or is unavailable, try next model
        if (response.status === 410 || response.status === 404) {
          console.log(`Model ${modelName} returned ${response.status}, trying next model...`);
          lastError = new Error(`Model ${modelName} is not available (may require accepting terms on Hugging Face)`);
          continue; // Try next model
        }
        
        if (response.status === 503) {
          throw new Error("AI model is loading. Please wait 10-20 seconds and try again.");
        }
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        
        // For other errors, try next model
        lastError = new Error(`AI service error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Handle different response formats from Hugging Face
      let generatedText = "";
      if (Array.isArray(data)) {
        generatedText = data[0]?.generated_text || JSON.stringify(data[0] || "");
      } else if (typeof data === "string") {
        generatedText = data;
      } else {
        generatedText = data.generated_text || data[0]?.generated_text || "";
      }
      
      if (!generatedText || generatedText.trim().length === 0) {
        console.error(`Empty response from ${modelName}:`, data);
        lastError = new Error(`Model ${modelName} returned empty response`);
        continue; // Try next model
      }

      // Clean and extract JSON
      let jsonText = generatedText.trim();
      
      // Remove markdown code blocks
      jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      
      // Remove any text before the first {
      const firstBrace = jsonText.indexOf("{");
      if (firstBrace > 0) {
        jsonText = jsonText.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = jsonText.lastIndexOf("}");
      if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
        jsonText = jsonText.substring(0, lastBrace + 1);
      }
      
      // Try to fix common JSON issues
      jsonText = jsonText
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2":') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes

      // Parse JSON
      let roadmap: RoadmapResponse;
      try {
        roadmap = JSON.parse(jsonText);
      } catch (parseError: any) {
        console.error(`JSON parse error for ${modelName}:`, parseError.message);
        console.error("Attempted to parse:", jsonText.substring(0, 500));
        lastError = new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        continue; // Try next model
      }

      // Validate structure
      if (!roadmap.roadmap || !Array.isArray(roadmap.roadmap) || roadmap.roadmap.length === 0) {
        console.error(`Invalid roadmap structure from ${modelName}`);
        lastError = new Error("Generated roadmap structure is invalid or empty");
        continue; // Try next model
      }

      // Ensure all required fields and fix week numbers
      roadmap.goal = roadmap.goal || goal;
      roadmap.totalWeeks = roadmap.totalWeeks || totalDuration;
      roadmap.weeklyHours = roadmap.weeklyHours || weeklyHours;
      
      roadmap.roadmap = roadmap.roadmap.map((week, index) => ({
        ...week,
        week: week.week || index + 1,
        summary: week.summary || `Week ${week.week || index + 1} learning activities`,
        topics: week.topics || [],
      }));

      // Success! Return the roadmap
      return roadmap;
    } catch (modelError: any) {
      console.error(`Error with model ${modelName}:`, modelError);
      lastError = modelError;
      continue; // Try next model
    }
  }

  // If we get here, all models failed - generate a basic roadmap structure as fallback
  console.warn("All AI models failed, generating fallback roadmap structure");
  
  // Generate a basic roadmap structure based on the goal
  const roadmap: RoadmapResponse = {
    goal,
    totalWeeks: totalDuration,
    weeklyHours,
    roadmap: [],
  };

  const fallbackTopicsPerWeek = Math.max(1, Math.floor(weeklyHours / 2));
  
  for (let week = 1; week <= totalDuration; week++) {
    roadmap.roadmap.push({
      week,
      summary: `Week ${week} focuses on building foundational skills for ${goal}`,
      topics: Array.from({ length: fallbackTopicsPerWeek }, (_, i) => ({
        title: `Day ${(week - 1) * fallbackTopicsPerWeek + i + 1}: Core Learning Topic ${i + 1}`,
        description: `Focus on essential concepts and practical exercises related to ${goal}. Build hands-on projects and practice regularly.`,
        estimatedHours: Math.floor(weeklyHours / fallbackTopicsPerWeek),
        whyImportant: `This topic is crucial for mastering ${goal} and building a strong foundation.`,
        whyThisOrder: `This sequence ensures you learn prerequisites before advanced concepts.`,
        commands: ["npm init -y", "git init"],
        files: [`week${week}_topic${i + 1}.js`, "README.md"],
        tools: ["Code Editor", "Terminal", "Git"],
        outcome: `You will have a working project demonstrating the core concepts for ${goal}.`,
      })),
    });
  }

  return roadmap;
}

export async function POST(req: Request) {
  try {
    const { goal, weeklyHours, totalDuration } = await req.json();

    // Validation
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json(
        { error: "Learning goal is required" },
        { status: 400 }
      );
    }

    if (!weeklyHours || typeof weeklyHours !== "number" || weeklyHours < 1) {
      return NextResponse.json(
        { error: "Valid weekly hours is required (minimum 1)" },
        { status: 400 }
      );
    }

    if (!totalDuration || typeof totalDuration !== "number" || totalDuration < 1) {
      return NextResponse.json(
        { error: "Valid duration in weeks is required (minimum 1)" },
        { status: 400 }
      );
    }

    // Generate roadmap using Hugging Face AI
    const roadmap = await generateRoadmapWithAI(goal.trim(), weeklyHours, totalDuration);

    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error("Roadmap generation error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to generate roadmap. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
