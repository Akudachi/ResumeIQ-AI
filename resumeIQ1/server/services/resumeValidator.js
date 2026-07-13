/**
 * Resume Validator Module
 * Validates whether uploaded document is actually a resume before analysis
 * Uses rule-based validation first, AI classification as fallback
 */

class ResumeValidator {
  constructor() {
    // Resume-specific sections
    this.resumeSections = [
      'summary', 'objective', 'experience', 'work experience', 'education',
      'skills', 'projects', 'certifications', 'achievements', 'languages',
      'internships', 'contact information', 'employment', 'work history',
      'professional summary', 'career objective', 'technical skills',
      'academic background', 'work experience', 'job experience'
    ];

    // Contact information patterns
    this.contactPatterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      linkedin: /linkedin\.com\/in\/[a-zA-Z0-9-_.%]+/,
      github: /github\.com\/[a-zA-Z0-9-_.%]+/,
      portfolio: /(portfolio|behance|dribbble)\.[a-z]+\/[a-zA-Z0-9-_.%]+/,
      website: /(http[s]?:\/\/)?(www\.)?[a-zA-Z0-9-_.]+\.[a-z]{2,}/
    };

    // Resume action verbs
    this.resumeKeywords = [
      'developed', 'built', 'implemented', 'experience', 'responsibilities',
      'technical skills', 'education', 'managed', 'led', 'created', 'designed',
      'achieved', 'improved', 'increased', 'decreased', 'optimized', 'analyzed',
      'coordinated', 'executed', 'delivered', 'established', 'maintained',
      'monitored', 'operated', 'organized', 'planned', 'produced', 'recommended',
      'researched', 'resolved', 'reviewed', 'scheduled', 'supervised', 'trained',
      'utilized', 'worked as', 'position', 'role', 'company'
    ];

    // Non-resume document keywords
    this.nonResumeKeywords = {
      marksheet: [
        'marks card', 'semester', 'sgpa', 'cgpa', 'subject code', 'internal marks',
        'external marks', 'university', 'board', 'roll number', 'hall ticket',
        'total marks', 'percentage', 'grade sheet', 'mark sheet', 'transcript',
        'academic record', 'course code', 'credit', 'gpa', 'attendance'
      ],
      certificates: [
        'certificate', 'certified', 'certification', 'award', 'recognition',
        'completion certificate', 'training certificate', 'course completion'
      ],
      identity: [
        'aadhaar', 'pan card', 'passport', 'driving licence', 'license',
        'voter id', 'identity card', 'government id', 'national identity'
      ],
      financial: [
        'invoice', 'receipt', 'bill', 'payment', 'transaction', 'amount due',
        'total amount', 'subtotal', 'tax', 'vat', 'gst', 'purchase order'
      ]
    };
  }

  /**
   * Main validation function
   * @param {string} text - Extracted text from document
   * @returns {Object} Validation result with confidence score
   */
  async validate(text) {
    const lowerText = text.toLowerCase();
    
    // Calculate scores
    const resumeScore = this.calculateResumeScore(text, lowerText);
    const nonResumeScore = this.calculateNonResumeScore(lowerText);
    
    // Determine final result
    const confidence = Math.max(resumeScore, nonResumeScore);
    const isResume = resumeScore > nonResumeScore;
    
    // Generate reason and detected type
    const { detectedType, reason } = this.generateAnalysis(
      text, 
      lowerText, 
      isResume, 
      confidence
    );
    
    return {
      isResume,
      confidence: Math.round(confidence),
      detectedType,
      reason
    };
  }

  /**
   * Calculate resume confidence score
   */
  calculateResumeScore(text, lowerText) {
    let score = 0;
    
    // Check for resume sections (max 40 points)
    const sectionsFound = this.resumeSections.filter(section => 
      lowerText.includes(section)
    );
    score += Math.min(sectionsFound.length * 8, 40);
    
    // Check for contact information (max 30 points)
    let contactScore = 0;
    if (this.contactPatterns.email.test(text)) contactScore += 8;
    if (this.contactPatterns.phone.test(text)) contactScore += 8;
    if (this.contactPatterns.linkedin.test(lowerText)) contactScore += 5;
    if (this.contactPatterns.github.test(lowerText)) contactScore += 4;
    if (this.contactPatterns.portfolio.test(lowerText)) contactScore += 3;
    if (this.contactPatterns.website.test(lowerText)) contactScore += 2;
    score += Math.min(contactScore, 30);
    
    // Check for resume keywords (max 25 points)
    const keywordsFound = this.resumeKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );
    score += Math.min(keywordsFound.length * 3, 25);
    
    // Check for document structure (max 10 points)
    if (this.hasResumeStructure(text)) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate non-resume document confidence score
   */
  calculateNonResumeScore(lowerText) {
    let maxScore = 0;
    let detectedCategory = '';
    
    // Check each non-resume category
    for (const [category, keywords] of Object.entries(this.nonResumeKeywords)) {
      const foundKeywords = keywords.filter(keyword => lowerText.includes(keyword));
      const score = Math.min(foundKeywords.length * 15, 95);
      
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }
    
    return maxScore;
  }

  /**
   * Check if text has resume-like structure
   */
  hasResumeStructure(text) {
    // Check for bullet points or numbered lists
    const hasBullets = /^[•\-\*]\s+/m.test(text) || /^\d+\.\s+/m.test(text);
    
    // Check for date ranges (common in experience sections)
    const hasDateRanges = /\d{4}\s*[-–to]+\s*\d{4}/.test(text);
    
    // Check for location patterns
    const hasLocations = /[A-Z][a-z]+,\s*[A-Z][a-z]+/.test(text);
    
    return hasBullets || hasDateRanges || hasLocations;
  }

  /**
   * Generate analysis reason and detected type
   */
  generateAnalysis(text, lowerText, isResume, confidence) {
    if (isResume) {
      const sections = this.resumeSections.filter(s => lowerText.includes(s));
      const hasContact = this.contactPatterns.email.test(text) || 
                        this.contactPatterns.phone.test(text);
      
      let detectedType = 'Resume';
      let reason = '';
      
      if (sections.length >= 3 && hasContact) {
        detectedType = 'Professional Resume';
        reason = `Contains multiple resume sections (${sections.slice(0, 3).join(', ')}) and contact information.`;
      } else if (sections.length >= 2) {
        detectedType = 'Resume';
        reason = `Contains resume sections: ${sections.slice(0, 2).join(', ')}.`;
      } else {
        detectedType = 'Basic Resume';
        reason = 'Contains resume keywords and basic structure.';
      }
      
      return { detectedType, reason };
    } else {
      // Determine non-resume type
      for (const [category, keywords] of Object.entries(this.nonResumeKeywords)) {
        const found = keywords.filter(k => lowerText.includes(k));
        if (found.length >= 2) {
          const typeMap = {
            marksheet: 'Academic Marksheet',
            certificates: 'Certificate',
            identity: 'Identity Document',
            financial: 'Financial Document'
          };
          return {
            detectedType: typeMap[category] || 'Non-Resume Document',
            reason: `Contains ${category}-specific keywords: ${found.slice(0, 3).join(', ')}.`
          };
        }
      }
      
      return {
        detectedType: 'Non-Resume Document',
        reason: 'Lacks resume-specific sections and structure.'
      };
    }
  }

  /**
   * AI classification fallback for uncertain cases
   * Only called when rule-based confidence is between 40-70%
   */
  async aiClassification(text) {
    try {
      // This would integrate with your AI service
      // For now, return a conservative result
      return {
        isResume: false,
        confidence: 50,
        detectedType: 'Uncertain',
        reason: 'AI classification not yet implemented. Rule-based validation was inconclusive.'
      };
    } catch (error) {
      console.error('AI classification error:', error);
      return {
        isResume: false,
        confidence: 50,
        detectedType: 'Uncertain',
        reason: 'AI classification failed. Please verify manually.'
      };
    }
  }
}

module.exports = new ResumeValidator();
