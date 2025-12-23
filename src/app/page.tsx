"use client";

import { useState, KeyboardEvent } from "react";

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

export default function Home() {
  const [goal, setGoal] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState("");

  const handleAddSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (!skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
        setSkillInput("");
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Please enter a learning goal");
      return;
    }

    if (!weeklyHours || parseInt(weeklyHours) < 1) {
      setError("Please enter a valid weekly time commitment (at least 1 hour)");
      return;
    }

    if (!totalDuration || parseInt(totalDuration) < 1) {
      setError("Please enter a valid total duration (at least 1 week)");
      return;
    }

    setLoading(true);
    setError("");
    setRoadmap(null);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentSkills: skills,
          goal: goal.trim(),
          weeklyHours: parseInt(weeklyHours),
          totalDuration: parseInt(totalDuration),
          durationUnit: "weeks",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate roadmap");
      }

      const data = await response.json();
      setRoadmap(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Smart Learning Path Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your AI academic counselor that creates personalized, time-bound learning
            roadmaps with clear reasoning for every step
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Current Skills */}
            <div>
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Current Skills
              </label>
              <input
                id="skills"
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Enter a skill and press Enter (e.g., JavaScript, Python, React)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none"
                        disabled={loading}
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Add your existing skills to get a personalized roadmap
              </p>
            </div>

            {/* Learning Goal */}
            <div>
              <label
                htmlFor="goal"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Target Career Goal *
              </label>
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Frontend Developer, AI Engineer, Data Scientist"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="weeklyHours"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Weekly Time Availability (hours) *
                </label>
                <input
                  id="weeklyHours"
                  type="number"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="totalDuration"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Total Duration (weeks) *
                </label>
                <input
                  id="totalDuration"
                  type="number"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(e.target.value)}
                  placeholder="e.g., 12"
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Your Learning Roadmap...
                </span>
              ) : (
                "Generate Learning Roadmap"
              )}
            </button>
          </div>
        </div>

        {/* Roadmap Display */}
        {roadmap && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Your Learning Roadmap: {roadmap.goal}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">
                    {roadmap.totalWeeks}
                  </strong>{" "}
                  weeks
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">
                    {roadmap.weeklyHours}
                  </strong>{" "}
                  hours/week
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">
                    {roadmap.totalWeeks * roadmap.weeklyHours}
                  </strong>{" "}
                  total hours
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {roadmap.roadmap.map((week, weekIndex) => (
                <div
                  key={week.week}
                  className="relative pl-8 border-l-2 border-blue-200 dark:border-blue-800"
                >
                  {/* Week Marker */}
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800"></div>

                  {/* Week Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Week {week.week}
                    </h3>
                    {week.summary && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {week.summary}
                      </p>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="space-y-4 mb-4">
                    {week.topics.map((topic, topicIndex) => (
                      <div
                        key={topicIndex}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                            {topic.title}
                          </h4>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap ml-3">
                            ~{topic.estimatedHours}h
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            {topic.description}
                          </p>
                        )}
                        <div className="space-y-2 text-sm">
                          {topic.whyImportant && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                                Why this is important:
                              </p>
                              <p className="text-blue-800 dark:text-blue-300">
                                {topic.whyImportant}
                              </p>
                            </div>
                          )}
                          {topic.whyThisOrder && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3">
                              <p className="font-medium text-purple-900 dark:text-purple-200 mb-1">
                                Why this order:
                              </p>
                              <p className="text-purple-800 dark:text-purple-300">
                                {topic.whyThisOrder}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resources */}
                  {week.resources && week.resources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Suggested Resources:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {week.resources.map((resource, idx) => (
                          <li key={idx}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
