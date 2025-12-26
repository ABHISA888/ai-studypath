"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";

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

export default function Home() {
  const [goal, setGoal] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState("");
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const roadmapRef = useRef<HTMLDivElement>(null);

  const generateRoadmap = async () => {
    if (!goal.trim()) {
      setError("Please enter a learning goal");
      return;
    }
    if (!weeklyHours || parseInt(weeklyHours) < 1) {
      setError("Please enter valid weekly hours (min 1)");
      return;
    }
    if (!totalDuration || parseInt(totalDuration) < 1) {
      setError("Please enter valid duration in weeks (minimum 1)");
      return;
    }

    setLoading(true);
    setError("");
    setRoadmap(null);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          weeklyHours: Number(weeklyHours),
          totalDuration: Number(totalDuration),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate roadmap");
      }

      const data = await res.json();
      setRoadmap(data);
      setOpenWeek(1);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again ...");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!roadmap) return;

    setExportingPDF(true);
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      
      // Expand all weeks for PDF
      const allWeeks = roadmap.roadmap.map(w => w.week);
      setOpenWeek(null);
      
      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the roadmap element
      const element = roadmapRef.current;
      if (!element) return;

      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true,
        logging: false,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const filename = `Learning_Roadmap_${roadmap.goal.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      pdf.save(filename);
      
      // Restore open week
      setOpenWeek(allWeeks[0] || 1);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Smart Learning Path
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            AI-powered personalized learning roadmaps tailored to your goals and schedule
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Learning Goal
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Build a SaaS app, Become a Frontend Developer, Learn Machine Learning"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder-slate-400"
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !loading && generateRoadmap()}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hours per Week
                </label>
                <input
                  type="number"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration (Weeks)
                </label>
                <input
                  type="number"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(e.target.value)}
                  placeholder="e.g., 12"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating your personalized roadmap...
                </span>
              ) : (
                "Generate Roadmap"
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600">AI is analyzing your goals and creating a personalized learning path...</p>
          </div>
        )}

        {/* Roadmap Display */}
        {roadmap && !loading && (
          <div ref={roadmapRef} className="space-y-6">
            {/* Roadmap Header with Export Button */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Your Learning Roadmap: {roadmap.goal}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{roadmap.totalWeeks}</span>
                      <span>weeks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{roadmap.weeklyHours}</span>
                      <span>hours/week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{roadmap.totalWeeks * roadmap.weeklyHours}</span>
                      <span>total hours</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                  className="ml-4 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {exportingPDF ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Weeks - Always expanded for PDF */}
            {roadmap.roadmap.map((week) => (
              <div key={week.week} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenWeek(openWeek === week.week ? null : week.week)}
                  className="w-full text-left p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        Week {week.week}
                      </h3>
                      <p className="text-slate-600">{week.summary}</p>
                    </div>
                    <svg
                      className={`w-6 h-6 text-slate-400 transition-transform ${openWeek === week.week ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {(openWeek === week.week || exportingPDF) && (
                  <div className="px-6 pb-6 space-y-4 border-t border-slate-200 pt-6">
                    {week.topics.map((topic, i) => (
                      <div key={i} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg text-slate-900 pr-4">{topic.title}</h4>
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                            {topic.estimatedHours}h
                          </span>
                        </div>
                        
                        <p className="text-slate-700 mb-4 leading-relaxed whitespace-pre-line">{topic.description}</p>

                        {topic.commands && topic.commands.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Commands</h5>
                            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                              {topic.commands.map((cmd, idx) => (
                                <div key={idx} className="mb-1">
                                  <span className="text-slate-500">$</span> <span>{cmd}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {topic.files && topic.files.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Files</h5>
                              <div className="flex flex-wrap gap-2">
                                {topic.files.map((file, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-mono">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {topic.tools && topic.tools.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tools</h5>
                              <div className="flex flex-wrap gap-2">
                                {topic.tools.map((tool, idx) => (
                                  <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {topic.outcome && (
                          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h5 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Expected Outcome</h5>
                            <p className="text-green-900 text-sm">{topic.outcome}</p>
                          </div>
                        )}

                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <div>
                            <span className="text-xs font-semibold text-indigo-700">Why Important:</span>
                            <p className="text-slate-600 text-sm mt-1">{topic.whyImportant}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-purple-700">Why This Order:</span>
                            <p className="text-slate-600 text-sm mt-1">{topic.whyThisOrder}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
