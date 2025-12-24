# Smart Learning Path Generator

An AI-powered web application that generates personalized, execution-ready learning roadmaps based on your goals, time commitment, and schedule.

## Features

- 🎯 **AI-Powered Roadmaps**: Dynamic, personalized learning paths generated using Hugging Face AI
- 📅 **Time-Bound Planning**: Customize your roadmap based on weekly hours and total duration
- 🔧 **Execution-Ready**: Each topic includes specific commands, files, tools, and clear outcomes
- 🎨 **Modern UI**: Clean, minimalistic design with beautiful gradients and smooth animations

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Hugging Face Inference API** (for AI-powered roadmap generation)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-studypath
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   HUGGINGFACE_API_KEY=your_api_key_here
   ```
   
   Get your free API key from [Hugging Face](https://huggingface.co/settings/tokens)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your learning goal (e.g., "Build a SaaS app", "Become a Frontend Developer")
2. Specify your weekly time availability (hours per week)
3. Set the total duration (weeks)
4. Click "Generate Roadmap" to get your personalized learning path

The AI will generate a detailed, week-by-week roadmap with:
- Specific learning topics for each day
- Exact commands to run
- Files to create
- Tools to use
- Clear learning outcomes
- Reasoning for why each topic is important and why it's in that order

## Status

✅ Core features implemented  
✅ Hugging Face AI integration  
✅ Modern UI with minimalistic design  
✅ Dynamic roadmap generation
