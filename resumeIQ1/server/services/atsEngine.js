class ATSEngine {
  static extractKeywords(text) {
    if (!text) return [];
    const words = text.toLowerCase()
      .replace(/[^a-z0-9+#-]/g, ' ')
      .split(/\s+/);
      
    const stopWords = new Set([
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
      'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
      'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because',
      'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
      'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
      'don', 'should', 'now', 'using', 'experience', 'work', 'role', 'team', 'company', 'required', 'skills',
      'job', 'description', 'requirements', 'years'
    ]);
    
    const filtered = words.filter(word => word.length > 2 && !stopWords.has(word));
    const freq = {};
    filtered.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }

  static analyze(text, jobDescription = null) {
    const result = {
      score: 0,
      suggestions: [],
      issues: [],
      missingSections: [],
      contactInfo: { present: false, score: 0 },
      summary: { present: false, score: 0 },
      skills: { present: false, score: 0 },
      projects: { present: false, score: 0, strength: 'Basic', recommendations: [] },
      experience: { present: false, score: 0 },
      education: { present: false, score: 0 },
      formatting: { score: 0 },
      actionVerbs: { score: 0 },
      achievements: { score: 0 },
      keywordDensity: { score: 0 },
      resumeLength: { score: 0 },
      sectionOrder: { score: 0 },
    };

    const lowerText = text.toLowerCase();

    // 1. Contact Information Scoring (email, phone, linkedin, github, portfolio)
    let contactScore = 0;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
    const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/i;
    const portfolioKeywords = ['portfolio', 'website', 'site', 'personal-page', 'personal page', 'github.io', 'vercel.app', 'netlify.app'];

    const hasEmail = emailRegex.test(text);
    const hasPhone = phoneRegex.test(text);
    const hasLinkedin = linkedinRegex.test(text);
    const hasGithub = githubRegex.test(text);
    const hasPortfolio = portfolioKeywords.some(keyword => lowerText.includes(keyword)) || (hasGithub && lowerText.includes('portfolio'));

    if (hasEmail) contactScore += 30;
    else {
      result.issues.push('Email address is missing');
      result.missingSections.push('Email');
    }

    if (hasPhone) contactScore += 30;
    else {
      result.issues.push('Phone number is missing or invalid');
      result.missingSections.push('Phone');
    }

    if (hasLinkedin) contactScore += 20;
    else result.suggestions.push('Add a professional LinkedIn profile URL');

    if (hasGithub || hasPortfolio) contactScore += 20;
    else result.suggestions.push('Add a GitHub or personal portfolio URL to showcase projects');

    result.contactInfo.present = hasEmail && hasPhone;
    result.contactInfo.score = contactScore;

    // 2. Summary Section Check
    const summaryKeywords = ['summary', 'objective', 'profile', 'about me', 'professional summary', 'executive summary'];
    const hasSummary = summaryKeywords.some(keyword => lowerText.includes(keyword));
    if (hasSummary) {
      result.summary.present = true;
      const summaryIndex = summaryKeywords.reduce((acc, word) => {
        const idx = lowerText.indexOf(word);
        return idx !== -1 && (acc === -1 || idx < acc) ? idx : acc;
      }, -1);

      let summaryWordCount = 0;
      if (summaryIndex !== -1) {
        const followingText = lowerText.substring(summaryIndex, summaryIndex + 600);
        summaryWordCount = followingText.split(/\s+/).length - 1;
      }

      if (summaryWordCount >= 30 && summaryWordCount <= 120) {
        result.summary.score = 100;
      } else {
        result.summary.score = 75;
        result.suggestions.push('Optimize the length of your professional summary (aim for 50-100 words)');
      }
    } else {
      result.issues.push('Professional summary or objective is missing');
      result.missingSections.push('Summary');
      result.summary.score = 0;
    }

    // 3. Skills Section Check (relative to Job Description if provided)
    const skillsKeywords = ['skills', 'technical skills', 'technologies', 'competencies', 'expertise', 'languages & technologies'];
    const hasSkills = skillsKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasSkills) {
      result.skills.present = true;
      if (jobDescription) {
        const SkillDetector = require('./skillDetector');
        const resumeSkills = SkillDetector.getAllSkills(text);
        const jdSkills = SkillDetector.getAllSkills(jobDescription);
        
        const matched = resumeSkills.filter(s => jdSkills.includes(s));
        result.skills.score = Math.round((matched.length / (jdSkills.length || 1)) * 100);
      } else {
        const words = lowerText.split(/\s+/);
        const skillCount = words.filter(w => w.length > 2 && !['and', 'for', 'with', 'the', 'use'].includes(w)).length;
        result.skills.score = Math.min(100, Math.max(50, 40 + skillCount));
      }
    } else {
      result.issues.push('Skills section is missing or lacks clear headings');
      result.missingSections.push('Skills');
      result.skills.score = 0;
    }

    // 4. Projects Section Check (calculated using multiple factors)
    const projectsKeywords = ['projects', 'project experience', 'key projects', 'portfolio', 'selected projects', 'academic projects'];
    const hasProjects = projectsKeywords.some(keyword => lowerText.includes(keyword));
    
    let projectScore = 0;
    let projectStrength = 'Basic';
    const projectRecommendations = [];
    
    if (hasProjects) {
      const projIdx = projectsKeywords.reduce((acc, kw) => {
        const idx = lowerText.indexOf(kw);
        return idx !== -1 && (acc === -1 || idx < acc) ? idx : acc;
      }, -1);
      
      let projectsText = '';
      if (projIdx !== -1) {
        const nextKeywords = ['education', 'skills', 'experience', 'certifications', 'languages', 'links'];
        let endIdx = lowerText.length;
        nextKeywords.forEach(kw => {
          const idx = lowerText.indexOf(kw, projIdx + 10);
          if (idx !== -1 && idx < endIdx) {
            endIdx = idx;
          }
        });
        projectsText = lowerText.substring(projIdx, endIdx);
      } else {
        projectsText = lowerText;
      }
      
      const projectBullets = (projectsText.match(/•|[\u2022\u2023\u25E6\u2043\u2219]|\*/g) || []).length;
      const lines = projectsText.split('\n').map(l => l.trim()).filter(Boolean);
      let projectCount = 0;
      lines.forEach(line => {
        if (line.includes(' - ') || line.includes(' | ') || line.includes(':') || (line.length < 50 && /^[A-Z]/.test(line))) {
          projectCount++;
        }
      });
      if (projectCount === 0 && projectBullets > 0) {
        projectCount = Math.max(1, Math.round(projectBullets / 3));
      }
      if (projectCount === 0) projectCount = 1;
      
      const SkillDetector = require('./skillDetector');
      const allDetectedSkills = SkillDetector.getAllSkills(projectsText);
      const techCount = allDetectedSkills.length;
      
      const projectActionVerbs = [
        'developed', 'created', 'built', 'implemented', 'designed', 'optimized',
        'launched', 'engineered', 'streamlined', 'integrated', 'automated'
      ];
      const verbMatches = projectActionVerbs.filter(verb => projectsText.includes(verb)).length;
      const hasMetrics = /%|\$\d+|\d+\s*(%|x|k|million|users|speed|performance|ms)/.test(projectsText);
      
      let countScore = Math.min(30, projectCount * 10);
      let techScore = Math.min(30, techCount * 5);
      let verbScore = Math.min(20, verbMatches * 5);
      let metricScore = hasMetrics ? 20 : 0;
      
      projectScore = countScore + techScore + verbScore + metricScore;
      projectScore = Math.min(100, Math.max(20, projectScore));
      
      if (projectScore >= 85) {
        projectStrength = 'Strong';
      } else if (projectScore >= 60) {
        projectStrength = 'Medium';
      } else {
        projectStrength = 'Basic';
      }
      
      if (projectCount < 2) {
        projectRecommendations.push('Add at least 2 detailed personal or professional projects to show depth.');
      }
      if (techCount < 4) {
        projectRecommendations.push('Specify the concrete technologies, frameworks, and libraries used in each project.');
      }
      if (verbMatches < 3) {
        projectRecommendations.push('Start your project bullet points with strong active engineering verbs (e.g. designed, automated, engineered).');
      }
      if (!hasMetrics) {
        projectRecommendations.push('Include measurable metrics of success (e.g. "improved latency by 30%") in your project descriptions.');
      }
      if (projectRecommendations.length === 0) {
        projectRecommendations.push('Projects section is strong and demonstrates hands-on implementation skills.');
      }
    } else {
      projectScore = 0;
      projectStrength = 'Basic';
      projectRecommendations.push('Consider adding a dedicated projects section to highlight hands-on work');
    }
    
    result.projects = {
      present: hasProjects,
      score: projectScore,
      strength: projectStrength,
      recommendations: projectRecommendations
    };

    // 5. Experience Section Check
    const experienceKeywords = ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'career history'];
    const hasExperience = experienceKeywords.some(keyword => lowerText.includes(keyword));
    if (hasExperience) {
      result.experience.present = true;
      const hasBulletedExperience = /•|\*|-/.test(text);
      result.experience.score = hasBulletedExperience ? 100 : 70;
      if (!hasBulletedExperience) {
        result.suggestions.push('Format your work experience bullet points starting with strong action verbs');
      }
    } else {
      result.issues.push('Work experience section is missing or unnamed');
      result.missingSections.push('Experience');
      result.experience.score = 0;
    }

    // 6. Education Section Check
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree', 'bachelor', 'master', 'phd', 'diploma'];
    const hasEducation = educationKeywords.some(keyword => lowerText.includes(keyword));
    if (hasEducation) {
      result.education.present = true;
      result.education.score = 100;
    } else {
      result.issues.push('Education background section is missing');
      result.missingSections.push('Education');
      result.education.score = 0;
    }

    // 7. Action Verbs Scoring
    const actionVerbs = [
      'achieved', 'improved', 'developed', 'created', 'managed', 'led', 'implemented', 'designed',
      'increased', 'decreased', 'reduced', 'optimized', 'launched', 'built', 'established', 'coordinated',
      'executed', 'delivered', 'generated', 'analyzed', 'streamlined', 'enhanced', 'spearheaded', 'initiated',
      'collaborated', 'engineered', 'formulated', 'directed', 'authored', 'pioneered', 'automated'
    ];
    const actionVerbMatches = actionVerbs.filter(verb => lowerText.includes(verb));
    const actionVerbCount = actionVerbMatches.length;
    result.actionVerbs.score = Math.min(100, Math.round((actionVerbCount / 8) * 100));
    if (actionVerbCount < 5) {
      result.suggestions.push('Incorporate more strong action verbs in your bullet points');
    }

    // 8. Quantified Achievements / Metrics
    const metricPatterns = [
      /\b\d+%\b/,
      /\$\b\d+/,
      /\b\d+\s*(million|billion|k|thousand|users|clients|leads|percent)\b/i,
      /\b(increased|decreased|reduced|optimized|saved|grew|revenue|performance|latency)\s+by\s+\b\d+/i,
      /\b\d+\+\b/
    ];
    const metricMatches = metricPatterns.filter(pattern => pattern.test(text)).length;
    result.achievements.score = metricMatches >= 4 ? 100 : (metricMatches >= 2 ? 75 : (metricMatches >= 1 ? 50 : 25));
    if (metricMatches < 3) {
      result.suggestions.push('Add quantifiable achievements and metrics to prove your impact');
    }

    // 9. Readability and Sentence Density
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length || 1;
    const avgSentenceLength = wordCount / sentenceCount;

    let readabilityScore = 100;
    if (avgSentenceLength > 25) {
      readabilityScore = 60;
      result.suggestions.push('Some sentences are too long. Simplify them for better readability.');
    } else if (avgSentenceLength < 8) {
      readabilityScore = 75;
      result.suggestions.push('Sentences are very short and choppy. Build smoother flow.');
    }
    result.formatting.score = readabilityScore;

    // 10. Keyword Density (relative to Job Description if provided)
    if (jobDescription) {
      const jdKeywords = this.extractKeywords(jobDescription).slice(0, 30);
      const resumeKeywords = this.extractKeywords(text);
      const matched = jdKeywords.filter(k => resumeKeywords.includes(k));
      
      result.keywordDensity.score = Math.round((matched.length / (jdKeywords.length || 1)) * 100);
    } else {
      const typicalKeywords = [
        'development', 'design', 'management', 'architecture', 'implementation', 'collaboration',
        'integration', 'agile', 'scrum', 'testing', 'deployment', 'optimization', 'cloud', 'security',
        'data', 'analytics', 'process', 'support', 'strategy', 'leadership', 'teamwork', 'communication'
      ];
      const matchingKeywords = typicalKeywords.filter(keyword => lowerText.includes(keyword));
      result.keywordDensity.score = Math.min(100, Math.round((matchingKeywords.length / 10) * 100));
    }

    // 11. Resume Length Score
    if (wordCount >= 300 && wordCount <= 750) {
      result.resumeLength.score = 100;
    } else if (wordCount < 300) {
      result.resumeLength.score = 45;
      result.issues.push('Resume word count is low. Add more context to your professional accomplishments.');
    } else {
      result.resumeLength.score = 70;
      result.suggestions.push('Your resume exceeds 800 words. Try to keep it concise.');
    }

    // 12. Section Order Score
    const sectionsInOrder = [];
    if (lowerText.includes('summary') || lowerText.includes('objective')) sectionsInOrder.push({ name: 'summary', idx: Math.max(lowerText.indexOf('summary'), lowerText.indexOf('objective')) });
    if (lowerText.includes('experience')) sectionsInOrder.push({ name: 'experience', idx: lowerText.indexOf('experience') });
    if (lowerText.includes('skills')) sectionsInOrder.push({ name: 'skills', idx: lowerText.indexOf('skills') });
    if (lowerText.includes('projects')) sectionsInOrder.push({ name: 'projects', idx: lowerText.indexOf('projects') });
    if (lowerText.includes('education')) sectionsInOrder.push({ name: 'education', idx: lowerText.indexOf('education') });

    let orderScore = 100;
    for (let i = 0; i < sectionsInOrder.length - 1; i++) {
      if (sectionsInOrder[i].idx > sectionsInOrder[i + 1].idx) {
        orderScore -= 25;
      }
    }
    result.sectionOrder.score = Math.max(0, orderScore);
    if (orderScore < 100) {
      result.suggestions.push('Rearrange sections to follow the standard chronological layout.');
    }

    // Calculate overall ATS score
    const scoreComponents = [
      result.contactInfo.score,
      result.summary.score,
      result.skills.score,
      result.experience.score,
      result.education.score,
      result.projects.score,
      result.actionVerbs.score,
      result.achievements.score,
      result.resumeLength.score,
      result.sectionOrder.score,
      result.keywordDensity.score,
    ];
    result.score = Math.round(scoreComponents.reduce((a, b) => a + b, 0) / scoreComponents.length);

    if (result.score < 50) {
      result.suggestions.unshift('CRITICAL: Your resume needs significant modifications to pass automated applicant tracking systems.');
    } else if (result.score < 75) {
      result.suggestions.unshift('GOOD: Your resume is structured well but requires metric indicators and stronger active vocabulary.');
    } else {
      result.suggestions.unshift('EXCELLENT: Your resume is highly optimized for ATS. Keep it up-to-date and tailored to specific job ads.');
    }

    return result;
  }
}

module.exports = ATSEngine;
