import { NextResponse } from "next/server";

interface Topic {
  title: string;
  description: string;
  estimatedHours: number;
  whyImportant: string;
  whyThisOrder: string;
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

function normalize(text: string) {
  return text.toLowerCase();
}

function detectTrack(goal: string) {
  const g = normalize(goal);

  if (g.includes("frontend") || g.includes("react")) return "frontend";
  if (g.includes("backend") || g.includes("node")) return "backend";
  if (g.includes("ai") || g.includes("ml")) return "ai";
  if (g.includes("saas")) return "saas";

  return "general";
}

function baseCurriculum(track: string) {
  switch (track) {
    case "frontend":
      return [
        "HTML & Accessibility",
        "CSS & Responsive Design",
        "JavaScript Fundamentals",
        "React Basics",
        "State & Hooks",
        "APIs & Async",
        "Mini Frontend Project",
      ];
    case "ai":
      return [
        "Python Basics",
        "Math for ML",
        "Data Handling",
        "ML Fundamentals",
        "Model Training",
        "Evaluation",
        "AI Mini Project",
      ];
    case "saas":
      return [
        "Product Thinking",
        "Frontend Basics",
        "Backend APIs",
        "Authentication",
        "Payments",
        "Deployment",
        "Launch MVP",
      ];
    default:
      return [
        "Programming Basics",
        "Core Concepts",
        "Hands-on Practice",
        "Projects",
      ];
  }
}

export async function POST(req: Request) {
  try {
    const { currentSkills, goal, weeklyHours, totalDuration } =
      await req.json();

    if (!goal || !weeklyHours || !totalDuration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const track = detectTrack(goal);
    const curriculum = baseCurriculum(track);

    const totalWeeks = totalDuration;
    const roadmap: RoadmapWeek[] = [];

    const topicsPerWeek = Math.max(
      1,
      Math.ceil(curriculum.length / totalWeeks)
    );

    let index = 0;

    for (let week = 1; week <= totalWeeks; week++) {
      const weekTopics = curriculum.slice(index, index + topicsPerWeek);
      index += topicsPerWeek;

      if (weekTopics.length === 0) break;

      roadmap.push({
        week,
        summary: `This week builds the key foundations required for ${goal}.`,
        topics: weekTopics.map((topic) => ({
          title: topic,
          description: `Focused learning and practice on ${topic}.`,
          estimatedHours: Math.floor(weeklyHours / weekTopics.length),
          whyImportant: `${topic} is essential for progressing toward ${goal}.`,
          whyThisOrder:
            "This topic is placed here to ensure prerequisites are learned before advanced concepts.",
        })),
        resources: [
          `Search YouTube: "${weekTopics[0]} tutorial"`,
          `Search Google: "${weekTopics[0]} roadmap"`,
          `Search GitHub: "${weekTopics[0]} example project"`,
        ],
      });
    }

    const response: RoadmapResponse = {
      goal,
      totalWeeks,
      weeklyHours,
      roadmap,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
