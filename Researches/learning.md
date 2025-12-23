# 📘 Learning Log – AI Smart Learning Path Generator

This document tracks what I am learning and implementing during the Gen AI Hackathon.

---

## 🔹 Project Overview
The **AI Smart Learning Path Generator** is an AI-powered academic counselor that creates a personalized, time-bound learning roadmap based on:
- Current skills
- Target goal
- Weekly time availability

The system does not provide static syllabi. Instead, it explains **why each topic appears in a specific order**, increasing learner motivation and clarity.

---

## 🔹 GenAI Concepts Involved

### 1. Prompt Engineering
I am designing a strong **System Prompt** that:
- Forces the AI to act as an academic counselor
- Enforces structured JSON output
- Prevents unnecessary explanations outside the JSON response

---

### 2. Few-Shot Prompting
The prompt will include example inputs and expected outputs so the AI learns:
- How to format weekly roadmaps
- How to generate reasoning fields like `why_this_first`

---

### 3. Structured JSON Output
The AI response will strictly follow a JSON schema containing:
- Week number
- Topics
- Duration
- Reasoning
- Resource search suggestions

This ensures seamless integration with the React frontend.

---

### 4. Agentic Reasoning
The AI is instructed to reason step-by-step internally and expose only the final structured result.
Each learning topic includes:
- **Why this topic is important**
- **Why it appears before or after other topics**

---

## 🔹 Why This Project Fits Hackathon 1
- No Vector Databases used
- Focuses purely on prompt design and AI reasoning
- Demonstrates real-world GenAI use in education
- Clean MERN + LLM integration

---

## 🔹 Next Implementation Steps
- Finalize system prompt
- Build backend API using Express
- Connect frontend form to AI response
- Render roadmap visually in React

---


