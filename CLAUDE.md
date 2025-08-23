# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build CSS**: `npm run build:css` - Compiles Tailwind CSS from source to main.css
- **Watch CSS**: `npm run watch:css` - Watches for changes and rebuilds CSS automatically
- **Development**: `npm run dev` - Prepares environment config and starts CSS watch mode
- **Serve locally**: `npm run serve` - Starts Express server on port 3000 with API proxy
- **Prepare environment**: `npm run prepare:env` - Generates config.js from .env variables

## Architecture Overview

This is a client-side English writing trainer application that uses Google's Gemini AI for writing analysis. The architecture consists of:

### Frontend Structure
- **Entry point**: `index.html` - Loading screen that redirects to the main dashboard
- **Main dashboard**: `pages/writing_practice_dashboard.html` - Primary interface
- **Pages**: Multiple HTML pages for different features (topic selection, writing interface, feedback analysis, history)
- **Styling**: Tailwind CSS with extensive custom configuration for educational UI components

### Backend Integration
- **AI Service**: `js/gemini-ai-service.js` - Core service class handling Gemini AI integration
- **Local Proxy**: `server.js` - Express server that proxies API requests to avoid CORS issues
- **Config Management**: `scripts/generate-config.mjs` - Generates client-side config from environment variables

### API Integration Pattern
The application uses a dual-mode approach for API calls:
- **Development**: Routes through local Express proxy (`/api/gemini`) when running on localhost:3000
- **Production**: Direct API calls to Google's Gemini API endpoint
- **Authentication**: API key sourced from window.__APP_CONFIG__ → localStorage → placeholder fallback

### Key Components

#### GeminiAIService Class
- **Purpose**: Manages all AI interactions with structured prompt engineering for Korean learners
- **Features**: Retry logic, rate limiting, response parsing, JSON extraction
- **Analysis Output**: Comprehensive writing feedback including grammar, vocabulary, structure scores and detailed corrections

#### Prompt Engineering
- Specialized for Korean English learners with focus on common mistakes (articles, prepositions, Konglish expressions)
- Returns structured JSON with grades, corrections, suggestions, and learning points
- Includes model answers and next steps for improvement

#### Data Management
- Uses localStorage for persistence of writing stats, drafts, and user progress
- Includes data clearing utilities for fresh starts
- No backend database - fully client-side storage

## Configuration Notes

- **Tailwind Config**: Extensive custom design system with educational app-specific colors, fonts, and components
- **Environment Setup**: GEMINI_API_KEY must be set in .env file for local development
- **Security**: Config generation script handles API key injection for client-side use (development only)

## File Organization

- `/pages/` - Individual HTML pages for different app sections
- `/js/` - JavaScript modules (primarily the AI service)
- `/css/` - Tailwind source and compiled CSS
- `/public/` - Static assets and generated config
- `/scripts/` - Build and configuration scripts

## Development Workflow

1. Set `GEMINI_API_KEY` in `.env` file
2. Run `npm run dev` to start development mode
3. Run `npm run serve` in separate terminal for API proxy
4. Access application at `http://localhost:3000`

The application is designed as a progressive web app for English writing practice with AI-powered feedback specifically tailored for Korean learners.