import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { skills, goal, time } = await req.json();

  return NextResponse.json({
    goal,
    message: "AI roadmap generation placeholder",
    skills,
    time
  });
}
