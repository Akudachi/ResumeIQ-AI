const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class AIRouter {
  static async analyzeResume(resumeText, jobDescription = null) {
    const prompt = this.buildAnalysisPrompt(resumeText, jobDescription);
    
    try {
      const geminiResult = await this.callGemini(prompt);
      return this.parseAIResponse(geminiResult);
    } catch (geminiError) {
      console.error('Gemini API failed, falling back to OpenRouter:', geminiError.message);
      
      try {
        const openRouterResult = await this.callOpenRouter(prompt);
        return this.parseAIResponse(openRouterResult);
      } catch (openRouterError) {
        console.error('OpenRouter API also failed:', openRouterError.message);
        throw new Error('All AI providers are currently unavailable. Please try again later.');
      }
    }
  }

  static async rewriteSection(section, originalText, context = '', resumeText = '', jobDescription = '') {
    const prompt = this.buildRewritePrompt(section, originalText, context, resumeText, jobDescription);
    
    try {
      const geminiResult = await this.callGemini(prompt);
      return this.parseAIResponse(geminiResult);
    } catch (geminiError) {
      console.error('Gemini API failed, falling back to OpenRouter:', geminiError.message);
      
      try {
        const openRouterResult = await this.callOpenRouter(prompt);
        return this.parseAIResponse(openRouterResult);
      } catch (openRouterError) {
        console.error('OpenRouter API also failed:', openRouterError.message);
        throw new Error('All AI providers are currently unavailable. Please try again later.');
      }
    }
  }

  static async matchJob(resumeText, jobDescription) {
    const prompt = this.buildJobMatchPrompt(resumeText, jobDescription);
    
    try {
      const geminiResult = await this.callGemini(prompt);
      return this.parseAIResponse(geminiResult);
    } catch (geminiError) {
      console.error('Gemini API failed, falling back to OpenRouter:', geminiError.message);
      
      try {
        const openRouterResult = await this.callOpenRouter(prompt);
        return this.parseAIResponse(openRouterResult);
      } catch (openRouterError) {
        console.error('OpenRouter API also failed:', openRouterError.message);
        throw new Error('All AI providers are currently unavailable. Please try again later.');
      }
    }
  }

  static async callGemini(prompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  static async callOpenRouter(prompt) {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  static buildAnalysisPrompt(resumeText, jobDescription) {
    return `You are a Senior Technical Recruiter at a top Silicon Valley startup (like Stripe, Vercel, or Linear). 
Analyze the following resume relative to the job description and provide a comprehensive evaluation in JSON format. Your critique should be professional, actionable, specific, and structured. Focus on concrete improvements rather than generic advice.

Resume Text:
${resumeText}

${jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : ''}

Provide a JSON response with the following keys and data types. Ensure all feedback sounds like it was written by an elite tech recruiter.

Return a JSON object with this exact structure:
{
  "resumeScore": number (0-100, representing Overall Resume Health),
  "atsScore": number (0-100),
  "jobMatchScore": number (0-100),
  "grammarScore": number (0-100),
  "formattingScore": number (0-100),
  "experienceScore": number (0-100),
  "projectScore": number (0-100),
  "educationScore": number (0-100),
  "skillScore": number (0-100),
  "keywordScore": number (0-100),
  "recruiterConfidence": "High" | "Medium" | "Low",
  "interviewReadiness": "High" | "Medium" | "Low",
  "resumeGrade": "A" | "B" | "C" | "D" | "F",
  "hiringProbability": number (0-100),
  "strengths": ["Specific strength 1 with context", "Specific strength 2 with context", "Specific strength 3 with context"],
  "weaknesses": ["Specific weakness 1 with context", "Specific weakness 2 with context", "Specific weakness 3 with context"],
  "criticalGaps": ["Specific critical gap 1 in relation to job", "Specific critical gap 2"],
  "priorityRecommendations": ["Priority action suggestion 1", "Priority action suggestion 2"],
  "estimatedAtsImprovement": number (estimated score boost e.g. 15),
  "suggestedJobTitles": ["Suggested Role 1", "Suggested Role 2"],
  "suggestedCompanyTypes": ["High-growth SaaS startups", "FAANG Tech Giants"],
  "recommendedSalaryRange": "string (e.g. $120k - $150k)",
  "industryFit": "string (e.g. Software Engineering / Cloud Platform)",
  "overallVerdict": "Detailed, professional analysis summarizing candidate suitability.",
  "improvementSuggestions": ["Actionable suggestion 1", "Actionable suggestion 2"],
  "recruiterFeedback": {
    "estimatedStrength": "Strong" | "Moderate" | "Weak",
    "likelyImpression": "A comprehensive recruiter review.",
    "shortlistDecision": "Highly Likely to Shortlist" | "Potential Shortlist (Maybe)" | "Unlikely to Shortlist (Reject)",
    "shortlistReason": "A detailed, professional justification explaining the shortlist decision.",
    "top5Strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5"],
    "top5Weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3", "Weakness 4", "Weakness 5"],
    "criticalImprovementSection": "The specific section needing the most work (e.g. Work Experience, Projects)",
    "criticalImprovementReason": "Why this section is holding back the resume.",
    "suitableCompanyTypes": ["High-growth Series A/B startups", "FAANG / Tier-1 Tech Giants"],
    "atsCompatibility": "High" | "Medium" | "Low",
    "suggestedNextActions": ["Priority 1: Urgent fix description", "Priority 2: Important wording adjustment"]
  }
}

Ensure all scores are realistic. Return ONLY valid JSON. Do not include markdown code block characters like \`\`\`json or \`\`\`. Start and end with curly braces.`;
  }

  static buildRewritePrompt(section, originalText, context, resumeText = '', jobDescription = '') {
    return `You are an expert resume writer and technical recruiter. Rewrite the following resume section: "${section}".
Make it highly impactful, professional, and ATS-friendly. Use active verbs, highlight metrics and outcomes, and remove generic fluff.
The rewrite should:
1. Improve grammar.
2. Improve impact.
3. Include ATS keywords naturally.
4. Never fabricate experience or invent achievements.
5. Never add fake metrics.

Original "${section}" Text:
${originalText}

Custom Context: ${context}

${resumeText ? `Candidate Resume Context:\n${resumeText}\n\n` : ''}
${jobDescription ? `Target Job Description Context:\n${jobDescription}\n\n` : ''}

Return a JSON response with this exact structure:
{
  "original": "${originalText.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "improved": "The rewritten version of the section. Keep formatting clear and professional.",
  "reason": "Detailed explanation of why changes were made and how it aligns with the target role.",
  "addedKeywords": ["Keyword A", "Keyword B"]
}

Return ONLY valid JSON. Do not wrap in markdown tags. Start and end with curly braces.`;
  }

  static buildJobMatchPrompt(resumeText, jobDescription) {
    return `You are a Senior Technical Recruiter. Compare the candidate's resume with the job description to perform a complete gap analysis.

Candidate Resume:
${resumeText}

Target Job Description:
${jobDescription}

Provide a JSON response with the following keys. All feedback must be highly specific, professional, and actionable.

Return a JSON object with this exact structure:
{
  "matchPercentage": number (0-100),
  "roleAlignment": number (0-100),
  "experienceMatch": number (0-100),
  "skillMatch": number (0-100),
  "keywordMatch": number (0-100),
  "matchingSkills": ["Skill A found in both", "Skill B", "Skill C"],
  "missingSkills": ["Critical skill X required but missing", "Skill Y", "Skill Z"],
  "missingKeywords": ["Important industry term or keyword missing from the resume", "Keyword B", "Keyword C"],
  "recommendedResumeChanges": ["Actionable improvement 1", "Actionable improvement 2"],
  "suggestedResumeSummary": "A suggested short summary tailored for this job description.",
  "suitableRoles": ["Job Title 1", "Job Title 2"],
  "experienceGap": "Description of any gaps in terms of years, seniority, or field of experience.",
  "educationGap": "Description of any gaps in education level or major field of study.",
  "atsMatchScore": number (0-100 representing keyword alignment),
  "technicalGaps": ["Detailed gap 1", "Detailed gap 2"],
  "suggestedImprovements": ["Actionable improvement 1", "Actionable improvement 2"]
}

Return ONLY valid JSON. Do not wrap in markdown tags. Start and end with curly braces.`;
  }

  static parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error.message);
      throw new Error('Failed to process AI response. Please try again.');
    }
  }
}

module.exports = AIRouter;
