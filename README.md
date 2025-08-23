# AI English Writing Trainer

A Korean-focused English writing trainer powered by Google's Gemini AI. Provides comprehensive writing analysis and feedback specifically designed for Korean learners.

## 🚀 Features

- **AI-Powered Analysis** - Google Gemini AI provides detailed writing feedback
- **Korean-Focused** - Specialized for common Korean learner mistakes (articles, prepositions, Konglish)
- **Comprehensive Feedback** - Grammar, vocabulary, structure, and fluency scoring
- **Interactive Writing Interface** - Topic selection and guided writing practice
- **Progress Tracking** - Writing history and improvement analytics
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 📋 Prerequisites

- Node.js (v18.x or higher)
- npm or yarn
- Google Gemini API key

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/slowdive14/writingassistant.git
cd writingassistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up your API key:
```bash
# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Or copy and edit the config template
cp public/config-template.js public/config.js
# Edit config.js with your API key
```

4. Start development:
```bash
npm run dev
npm run serve  # In another terminal for API proxy
```

5. Open http://localhost:3000

## 🌐 Live Demo

Visit: **https://slowdive14.github.io/writingassistant/**

## 📁 Project Structure

```
html_app/
├── css/
│   ├── tailwind.css   # Tailwind source file with custom utilities
│   └── main.css       # Compiled CSS (generated)
├── pages/             # HTML pages
├── index.html         # Main entry point
├── package.json       # Project dependencies and scripts
└── tailwind.config.js # Tailwind CSS configuration
```

## 🎨 Styling

This project uses Tailwind CSS for styling. Custom utility classes include:


## 🧩 Customization

To customize the Tailwind configuration, edit the `tailwind.config.js` file:


## 📦 Build for Production

Build the CSS for production:

```bash
npm run build:css
# or
yarn build:css
```

## 📱 Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints:

- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up
- `2xl`: 1536px and up

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by HTML and Tailwind CSS

Built with ❤️ on Rocket.new
