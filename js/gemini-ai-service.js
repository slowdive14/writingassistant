class GeminiAIService {
    constructor() {
        this.apiKey = this.getAPIKey();
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        try {
            this.useProxy = typeof window !== 'undefined' && window.location && window.location.origin.indexOf('http://localhost:3000') === 0;
        } catch (_) { this.useProxy = false; }
    }

    getAPIKey() {
        // Priority: window config -> localStorage -> placeholder
        try {
            const fromConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.GEMINI_API_KEY) || '';
            if (fromConfig && typeof fromConfig === 'string') return fromConfig;
        } catch (_) {}
        return localStorage.getItem('GEMINI_API_KEY') || 'your_gemini_api_key';
    }

    async analyzeWriting(writingData) {
        if (!this.apiKey || this.apiKey === 'your_gemini_api_key') {
            throw new Error('GEMINI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
        }

        const prompt = this.buildAnalysisPrompt(writingData);
        
        try {
            const response = await this.makeRequest(prompt);
            return this.parseResponse(response, writingData);
        } catch (error) {
            console.error('GEMINI AI 분석 오류:', error);
            throw new Error('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }

    buildAnalysisPrompt(writingData) {
        return `
Please analyze this English writing and provide comprehensive feedback in Korean.

**Writing Information:**
- Topic: ${writingData.topic.title}
- Level: ${writingData.topic.difficulty}
- Length: ${writingData.wordCount} words
- Time: ${writingData.writingTime}

**Student's Writing:**
${writingData.content}

Please provide a detailed analysis in the following JSON format:

{
    "quickSummary": {
        "grade": "A+/A/B+/B/C+/C/D+/D/F",
        "oneLineFeedback": "Core feedback in one sentence (Korean)",
        "scores": {
            "grammar": 0-100,
            "vocabulary": 0-100,
            "structure": 0-100,
            "clarity": 0-100
        }
    },
    
    "mustFix": [
        {
            "priority": "🔴 High/🟡 Medium/🟢 Low",
            "original": "Original text",
            "corrected": "Corrected version",
            "rule": "Brief grammar rule explanation (Korean)",
            "example": "Similar correct example sentence"
        }
    ],
    
    "betterExpressions": [
        {
            "original": "Current expression",
            "suggestions": [
                {
                    "improved": "Improvement option 1",
                    "level": "Basic/Intermediate/Advanced",
                    "nuance": "Nuance explanation (Korean)"
                }
            ],
            "tip": "💡 Practical tip (Korean)"
        }
    ],
    
    "wellDone": [
        {
            "highlight": "Quote of good writing",
            "reason": "Why this is good (Korean)"
        }
    ],
    
    "learningPoints": {
        "grammarPatterns": [
            {
                "pattern": "Frequently mistaken pattern",
                "correct": "Correct usage",
                "practice": "Practice example"
            }
        ],
        "vocabularyTips": [
            {
                "word": "Word/Expression",
                "usage": "Proper usage",
                "collocations": ["Common collocations"]
            }
        ]
    },
    
    "nextSteps": {
        "focusArea": "Area to focus on next (Korean)",
        "exercises": ["Recommended exercise 1", "Recommended exercise 2"],
        "goalSetting": "Goal for next writing (Korean)"
    },
    
    "modelAnswer": "A model answer for the same topic (one level higher than student's current level)"
}

**Analysis Criteria:**
1. Focus on grammar mistakes commonly made by Korean learners
2. Identify Konglish expressions and provide natural English alternatives
3. Check naturalness of sentence connections and transition phrases
4. Find repetitive expressions and suggest variety
5. Evaluate overall logical flow and paragraph organization

**Feedback Principles:**
- 🎯 Present the 3 most important corrections first
- ✅ Always mention strengths for motivation
- 📝 Explain "why" for each correction
- 🔄 Group similar mistakes into patterns
- 📚 Provide practical, usable example sentences

**Special Instructions for Korean Learners:**
- Pay special attention to article usage (a/an/the)
- Check for subject-verb agreement issues
- Identify preposition errors common among Korean speakers
- Look for word order problems, especially with adverbs
- Check for tense consistency throughout the writing
- Identify missing or unnecessary plural markers
- Note any direct translations from Korean that sound unnatural

**Response Language:**
- All explanations, feedback, and tips should be in Korean
- Only the corrected sentences and examples should be in English
- Use clear, encouraging Korean that's easy to understand
- Avoid overly technical linguistic terms unless necessary
\n+STRICT OUTPUT REQUIREMENTS:\n- Return STRICT JSON only. No markdown, no code fences, no prose before/after.\n- Use double quotes for all keys and string values.\n- Do not include trailing commas.\n- Ensure arrays and objects are valid JSON.
`;
    }

    async makeRequest(prompt, retryCount = 0) {
        try {
            const endpoint = this.useProxy ? '/api/gemini' : `${this.baseURL}?key=${this.apiKey}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 8000,
                        responseMimeType: "application/json"
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < this.maxRetries) {
                    // Rate limited, retry with exponential backoff
                    await this.sleep(this.retryDelay * Math.pow(2, retryCount));
                    return this.makeRequest(prompt, retryCount + 1);
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API 오류 (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            if (retryCount < this.maxRetries && (error.name === 'TypeError' || error.message.includes('네트워크'))) {
                await this.sleep(this.retryDelay * Math.pow(2, retryCount));
                return this.makeRequest(prompt, retryCount + 1);
            }
            throw error;
        }
    }

    parseResponse(response, originalData) {
        try {
            const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('AI 응답을 받지 못했습니다.');
            }
            try { 
                localStorage.setItem('lastRawResponse', content);
                localStorage.setItem('lastResponseTimestamp', new Date().toISOString());
                console.log('Raw AI response length:', content.length);
                console.log('Response preview:', content.slice(0, 200) + '...');
            } catch (_) {}

            // Extract JSON from the response (robust)
            let cleaned = content
                .replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''))
                .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
                .trim();
            // Strip wrapping single quotes if the whole payload is quoted
            if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
                cleaned = cleaned.slice(1, -1);
            }

            const jsonText = (function extractBalancedJSON(text) {
                let start = -1; let inStr = false; let esc = false;
                const stack = [];
                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    if (inStr) {
                        if (esc) { esc = false; continue; }
                        if (ch === '\\') { esc = true; continue; }
                        if (ch === '"') { inStr = false; }
                        continue;
                    }
                    if (ch === '"') { inStr = true; continue; }
                    if (ch === '{') {
                        if (stack.length === 0) start = (start === -1 ? i : start);
                        stack.push('}');
                    } else if (ch === '[') {
                        if (stack.length === 0) start = (start === -1 ? i : start);
                        stack.push(']');
                    } else if ((ch === '}' || ch === ']') && stack.length > 0) {
                        stack.pop();
                        if (start !== -1 && stack.length === 0) {
                            return text.slice(start, i + 1);
                        }
                    }
                }
                if (start !== -1) {
                    let slice = text.slice(start);
                    while (stack.length > 0) slice += stack.pop();
                    return slice;
                }
                const match = text.match(/\{[\s\S]*\}/);
                return match ? match[0] : '';
            })(cleaned.replace(/```json/gi, '').replace(/```/g, '').replace(/`/g, ''));

            if (!jsonText) {
                throw new Error('AI 응답 형식이 올바르지 않습니다.');
            }

            const parseJSONLoose = (str) => {
                let fixed = str
                    .replace(/[""]/g, '"')
                    .replace(/['']/g, "'")
                    // remove trailing commas before ] or }
                    .replace(/,\s*([}\]])/g, '$1');
                
                // add missing commas between adjacent string items
                fixed = fixed.replace(/"\s+(?=")/g, '", ');
                // attempt to add missing commas between tokens like } { or ] { or " {
                fixed = fixed.replace(/([}\]\"]|\d)\s+(?=[{\[\"-])/g, '$1, ');
                // change list bullets inside arrays to commas
                fixed = fixed.replace(/"\s*-\s*(?=")/g, '", ');
                
                // Handle truncation by completing incomplete JSON structure
                const openBraces = (fixed.match(/\{/g) || []).length;
                const closeBraces = (fixed.match(/\}/g) || []).length;
                const openBrackets = (fixed.match(/\[/g) || []).length;
                const closeBrackets = (fixed.match(/\]/g) || []).length;
                const openQuotes = (fixed.match(/"/g) || []).length;
                
                // Close unmatched quotes (if odd number)
                if (openQuotes % 2 === 1) {
                    fixed += '"';
                }
                
                // Close unmatched brackets and braces
                const bracketDiff = openBrackets - closeBrackets;
                const braceDiff = openBraces - closeBraces;
                
                for (let i = 0; i < bracketDiff; i++) {
                    fixed += ']';
                }
                for (let i = 0; i < braceDiff; i++) {
                    fixed += '}';
                }
                
                try {
                    return JSON.parse(fixed);
                } catch (e) {
                    // Last resort: try to extract and complete the main object
                    const match = fixed.match(/\{[\s\S]*$/);
                    if (match) {
                        let partial = match[0];
                        // Ensure it ends properly
                        if (!partial.endsWith('}')) {
                            // Remove any trailing incomplete content
                            partial = partial.replace(/[,\s]*$/, '');
                            if (!partial.endsWith('"') && !partial.endsWith('}') && !partial.endsWith(']')) {
                                partial += '"';
                            }
                            partial += '}';
                        }
                        return JSON.parse(partial);
                    }
                    throw e;
                }
            };

            console.log('Attempting to parse JSON, length:', jsonText.length);
            const raw = parseJSONLoose(jsonText);
            console.log('JSON parsing successful, keys:', Object.keys(raw));

            // Normalize new schema -> legacy fields used by UI
            const summary = raw.quickSummary || {};
            const scores = summary.scores || {};

            const overallGrade = summary.grade || 'B';
            const grammarScore = Number(scores.grammar ?? 0);
            const vocabularyScore = Number(scores.vocabulary ?? 0);
            const structureScore = Number(scores.structure ?? 0);
            const clarityScore = Number(scores.clarity ?? 0);
            const fluencyScore = Math.round((structureScore + clarityScore) / 2) || structureScore || clarityScore || 0;

            const strengths = Array.isArray(raw.wellDone)
                ? raw.wellDone.map(w => w.reason || w.highlight).filter(Boolean).slice(0, 5)
                : [];

            const corrections = Array.isArray(raw.mustFix)
                ? raw.mustFix.map(m => ({
                    original: m.original,
                    corrected: m.corrected,
                    explanation: m.rule
                })).filter(c => c.original && c.corrected)
                : [];

            const suggestions = Array.isArray(raw.betterExpressions)
                ? raw.betterExpressions.flatMap(b => {
                    const first = Array.isArray(b.suggestions) ? b.suggestions[0] : null;
                    if (!first) return [];
                    return [{
                        current: b.original,
                        improved: first.improved,
                        reason: first.nuance || b.tip
                    }];
                })
                : [];

            const grammarAnalysis = (raw.learningPoints?.grammarPatterns || [])
                .map(p => `• ${p.pattern} → ${p.correct} (ex: ${p.practice})`).join('\n');
            const vocabularyAnalysis = (raw.learningPoints?.vocabularyTips || [])
                .map(v => `• ${v.word}: ${v.usage}${v.collocations ? ` | collocations: ${v.collocations.join(', ')}` : ''}`).join('\n');
            const structureAnalysis = summary.oneLineFeedback || '';
            const improvementAreas = [raw.nextSteps?.focusArea, ...(raw.nextSteps?.exercises || [])].filter(Boolean);

            const normalized = {
                overallGrade,
                grammarScore,
                vocabularyScore,
                fluencyScore,
                strengths,
                corrections,
                suggestions,
                detailedFeedback: {
                    grammarAnalysis,
                    vocabularyAnalysis,
                    structureAnalysis,
                    improvementAreas
                },
                originalSchema: raw
            };

            // Add metadata
            normalized.metadata = {
                topic: originalData.topic.title,
                wordCount: originalData.wordCount,
                writingTime: originalData.writingTime,
                analysisTime: new Date().toISOString(),
                apiVersion: 'gemini-2.5-flash-lite-preview-06-17',
                difficulty: originalData.topic.difficulty
            };

            return normalized;
        } catch (error) {
            console.error('응답 파싱 오류:', error);
            console.error('Raw response:', content?.slice(0, 500) + '...');
            
            // Return fallback response if parsing completely fails
            return this.createFallbackResponse(originalData, error);
        }
    }

    createFallbackResponse(originalData, error) {
        console.warn('Creating fallback response due to parsing failure:', error.message);
        
        return {
            overallGrade: 'B',
            grammarScore: 70,
            vocabularyScore: 70,
            fluencyScore: 70,
            strengths: [
                '작문을 완료하신 노력이 훌륭합니다',
                '주제에 맞는 내용을 작성하셨습니다'
            ],
            corrections: [
                {
                    original: '일시적 분석 오류',
                    corrected: 'Temporary analysis error',
                    explanation: 'AI 분석 중 일시적인 오류가 발생했습니다. 다시 시도해주세요.'
                }
            ],
            suggestions: [
                {
                    current: '현재 분석 불가',
                    improved: 'Analysis temporarily unavailable',
                    reason: '잠시 후 다시 시도해주세요'
                }
            ],
            detailedFeedback: {
                grammarAnalysis: 'AI 분석이 일시적으로 불가능합니다. 다시 시도해주세요.',
                vocabularyAnalysis: '어휘 분석을 위해 다시 제출해주세요.',
                structureAnalysis: '구조 분석이 준비되는 대로 제공하겠습니다.',
                improvementAreas: ['다시 분석을 요청해주세요']
            },
            metadata: {
                topic: originalData.topic.title,
                wordCount: originalData.wordCount,
                writingTime: originalData.writingTime,
                analysisTime: new Date().toISOString(),
                apiVersion: 'gemini-2.5-flash-lite-preview-06-17-fallback',
                difficulty: originalData.topic.difficulty,
                error: 'parsing_failure'
            },
            originalSchema: null
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility method to set API key
    static setAPIKey(apiKey) {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
    }

    // Utility method to check if API key is configured
    static isConfigured() {
        try {
            const cfg = (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.GEMINI_API_KEY) || '';
            if (cfg && cfg !== 'your_gemini_api_key') return true;
        } catch (_) {}
        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        return apiKey && apiKey !== 'your_gemini_api_key';
    }

    // Clear all stored data and reset to fresh state
    // options: { silent?: boolean, reload?: boolean | 'ask', exclude?: string[] }
    static clearAllData(options = {}) {
        const { silent = false, reload = 'ask', exclude = [] } = options;
        const keysToRemove = [
            'writingStats',
            'currentFeedback',
            'currentSubmission',
            'currentWritingContent',
            'currentWritingTopic',
            'feedbackSatisfaction',
            'userFeedback',
            'modalScrollPosition',
            'draftEssay',
            'currentEssay',
            'recentActivities',
            'learningProgress'
        ];

        keysToRemove.forEach(key => {
            if (!exclude.includes(key)) {
            localStorage.removeItem(key);
            }
        });

        if (!silent) {
        console.log('모든 저장된 데이터가 삭제되었습니다. 새로운 시작입니다.');
        }
        
        // Reload behavior
        if (reload === true) {
            window.location.reload();
        } else if (reload === 'ask' && !silent) {
            if (confirm('데이터 초기화가 완료되었습니다. 페이지를 새로고침하시겠습니까?')) {
                window.location.reload();
            }
        }
    }
}

// Export for use in other modules
window.GeminiAIService = GeminiAIService;