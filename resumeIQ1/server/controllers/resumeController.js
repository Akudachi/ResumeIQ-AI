const Resume = require('../models/Resume');
const FileParser = require('../services/fileParser');
const ATSEngine = require('../services/atsEngine');
const SkillDetector = require('../services/skillDetector');
const AIRouter = require('../services/aiRouter');
const resumeValidator = require('../services/resumeValidator');
const crypto = require('crypto');
const mongoose = require('mongoose');

class ResumeController {
  // Helper method to find resume by either ObjectId or fileHash
  static async findResumeByIdentifier(identifier) {
    // Try as ObjectId first
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const resume = await Resume.findById(identifier);
      if (resume) return resume;
    }

    // Try as fileHash
    return await Resume.findOne({ fileHash: identifier });
  }
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      const originalFilename = req.file.originalname;
      const mimeType = req.file.mimetype;

      // Parse file
      const extractedText = await FileParser.parseFile(filePath, mimeType);

      // Validate document is actually a resume (unless bypass flag is set)
      const bypassValidation = req.body.bypassValidation === 'true';

      if (!bypassValidation) {
        const validationResult = await resumeValidator.validate(extractedText);

        // Reject if confidence is below 75%
        if (validationResult.confidence < 75) {
          FileParser.cleanup(filePath);
          return res.status(400).json({
            success: false,
            message: 'Document validation failed',
            validation: validationResult,
            requiresConfirmation: false
          });
        }
      }

      // Generate file hash for caching
      const fileHash = crypto.createHash('sha256').update(extractedText).digest('hex');

      // Detect skills
      const detectedSkills = SkillDetector.detect(extractedText);
      const allSkills = SkillDetector.getAllSkills(extractedText);

      // Parse basic information
      const parsedData = ResumeController.parseBasicInfo(extractedText, detectedSkills);

      // Create resume object (let MongoDB generate _id)
      const resumeData = {
        originalFilename,
        extractedText,
        fileHash,
        parsedData: {
          ...parsedData,
          skills: allSkills
        },
        createdAt: new Date()
      };

      // Save to MongoDB
      const existingResume = await Resume.findOne({ fileHash });
      if (existingResume) {
        FileParser.cleanup(filePath);
        return res.json({
          success: true,
          message: 'Resume already analyzed',
          data: existingResume.toObject(),
          resumeId: existingResume._id.toString()
        });
      }

      const resume = new Resume(resumeData);
      await resume.save();
      FileParser.cleanup(filePath);

      res.json({
        success: true,
        message: 'Resume uploaded successfully',
        data: resume.toObject(),
        resumeId: resume._id.toString(),
        fileHash: fileHash
      });

    } catch (error) {
      console.error('Upload error details:', error);
      if (req.file) {
        FileParser.cleanup(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload resume',
        error: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async parseJD(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;

      const extractedText = await FileParser.parseFile(filePath, mimeType);
      FileParser.cleanup(filePath);

      res.json({
        success: true,
        message: 'Job Description parsed successfully',
        text: extractedText
      });
    } catch (error) {
      console.error('JD parse error:', error);
      if (req.file) {
        FileParser.cleanup(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to parse Job Description file'
      });
    }
  }

  static async analyze(req, res) {
    try {
      const { resumeId, jobDescription } = req.body;

      if (!resumeId) {
        return res.status(400).json({
          success: false,
          message: 'Resume ID is required'
        });
      }

      const resume = await ResumeController.findResumeByIdentifier(resumeId);

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      // Run ATS analysis relative to Job Description
      const atsResult = ATSEngine.analyze(resume.extractedText, jobDescription);

      atsResult.skillsScore = atsResult.skills.score;
      atsResult.projectsScore = atsResult.projects.score;
      atsResult.experienceScore = atsResult.experience.score;
      atsResult.educationScore = atsResult.education.score;
      atsResult.keywordScore = atsResult.keywordDensity.score;
      atsResult.contactScore = atsResult.contactInfo.score;
      atsResult.summaryScore = atsResult.summary.score;

      // Run AI analysis
      const aiAnalysis = await AIRouter.analyzeResume(resume.extractedText, jobDescription);

      // Run Job Match analysis
      const jobMatch = await AIRouter.matchJob(resume.extractedText, jobDescription);
      jobMatch.jobDescription = jobDescription;

      // Temporary debug logging
      console.log('--- DEBUG START ---');
      console.log('Resume extracted:', resume.extractedText.substring(0, 150) + '...');
      console.log('Job Description extracted:', jobDescription ? jobDescription.substring(0, 150) + '...' : 'None');
      
      const SkillDetector = require('../services/skillDetector');
      const resumeSkills = SkillDetector.getAllSkills(resume.extractedText);
      const jdSkills = jobDescription ? SkillDetector.getAllSkills(jobDescription) : [];
      console.log('Detected skills (Resume):', resumeSkills);
      console.log('Detected skills (Job Description):', jdSkills);
      
      const resumeKeywords = ATSEngine.extractKeywords(resume.extractedText);
      const jdKeywords = jobDescription ? ATSEngine.extractKeywords(jobDescription) : [];
      console.log('Detected keywords (Resume):', resumeKeywords.slice(0, 15));
      console.log('Detected keywords (Job Description):', jdKeywords.slice(0, 15));
      
      console.log('ATS score:', atsResult.score);
      console.log('Job Match:', jobMatch);
      console.log('AI response:', aiAnalysis);
      
      const missingKeywords = jdKeywords.filter(k => !resumeKeywords.includes(k));
      const matchedSkills = resumeSkills.filter(s => jdSkills.includes(s));
      console.log('Missing keywords:', missingKeywords);
      console.log('Matched skills:', matchedSkills);
      console.log('--- DEBUG END ---');

      // Update resume with analysis and jobMatch
      const updatedResume = await Resume.findOneAndUpdate({ _id: resume._id }, {
        analysis: aiAnalysis,
        atsResult: atsResult,
        jobMatch: jobMatch
      }, { new: true });

      res.json({
        success: true,
        message: 'Resume analyzed successfully',
        data: updatedResume
      });

    } catch (error) {
      console.error('Analyze error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze resume'
      });
    }
  }

  static async jobMatch(req, res) {
    try {
      const { resumeId, jobDescription } = req.body;

      if (!resumeId || !jobDescription) {
        return res.status(400).json({
          success: false,
          message: 'Resume ID and job description are required'
        });
      }

      const resume = await ResumeController.findResumeByIdentifier(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      const jobMatch = await AIRouter.matchJob(resume.extractedText, jobDescription);
      jobMatch.jobDescription = jobDescription;
      
      await Resume.findOneAndUpdate({ _id: resume._id }, { jobMatch: jobMatch });

      res.json({
        success: true,
        message: 'Job match analysis completed',
        data: jobMatch
      });

    } catch (error) {
      console.error('Job match error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to match job'
      });
    }
  }

  static async rewrite(req, res) {
    try {
      const { section, originalText, context, resumeId } = req.body;

      if (!section || !originalText) {
        return res.status(400).json({
          success: false,
          message: 'Section and original text are required'
        });
      }

      let resumeText = '';
      let jobDescription = '';

      if (resumeId) {
        const resume = await ResumeController.findResumeByIdentifier(resumeId);
        if (resume) {
          resumeText = resume.extractedText || '';
          jobDescription = resume.jobMatch?.jobDescription || '';
        }
      }

      const rewrite = await AIRouter.rewriteSection(section, originalText, context, resumeText, jobDescription);

      res.json({
        success: true,
        message: 'Section rewritten successfully',
        data: rewrite
      });

    } catch (error) {
      console.error('Rewrite error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to rewrite section'
      });
    }
  }

  static async skills(req, res) {
    try {
      const resumeId = req.query.resumeId || req.body.resumeId;
      if (!resumeId) {
        return res.status(400).json({ success: false, message: 'Resume ID is required' });
      }

      const resume = await ResumeController.findResumeByIdentifier(resumeId);
      if (!resume) {
        return res.status(404).json({ success: false, message: 'Resume not found' });
      }

      const SkillDetector = require('../services/skillDetector');
      const resumeSkills = SkillDetector.getAllSkills(resume.extractedText);
      
      const jobDesc = resume.jobMatch?.jobDescription || '';
      const jdSkills = jobDesc ? SkillDetector.getAllSkills(jobDesc) : [];
      
      const detected = SkillDetector.detect(resume.extractedText);
      const categorizedSkills = {
        Programming: detected.programming || [],
        Frontend: detected.frontend || [],
        Backend: detected.backend || [],
        Databases: detected.databases || [],
        Cloud: detected.cloud || [],
        AI: detected.ai || [],
        MachineLearning: detected.machineLearning || [],
        DevOps: detected.devops || [],
        Tools: detected.tools || [],
        VersionControl: detected.versionControl || [],
        OperatingSystems: detected.operatingSystems || [],
        Frameworks: detected.frameworks || [],
        Libraries: detected.libraries || []
      };

      const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));
      const score = resume.analysis?.skillScore || (jdSkills.length ? Math.round((resumeSkills.filter(s => jdSkills.includes(s)).length / jdSkills.length) * 100) : 50);
      
      let strengthLevel = 'Basic';
      if (score >= 80) strengthLevel = 'Strong';
      else if (score >= 50) strengthLevel = 'Medium';

      res.json({
        success: true,
        score,
        categorizedSkills,
        missingSkills,
        strengthLevel
      });
    } catch (error) {
      console.error('Skills endpoint error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async keywords(req, res) {
    try {
      const resumeId = req.query.resumeId || req.body.resumeId;
      if (!resumeId) {
        return res.status(400).json({ success: false, message: 'Resume ID is required' });
      }

      const resume = await ResumeController.findResumeByIdentifier(resumeId);
      if (!resume) {
        return res.status(404).json({ success: false, message: 'Resume not found' });
      }

      const jobDesc = resume.jobMatch?.jobDescription || '';
      const resumeText = resume.extractedText;

      const jdKeywords = ATSEngine.extractKeywords(jobDesc).slice(0, 30);
      const resumeKeywords = ATSEngine.extractKeywords(resumeText);

      const matchedKeywords = jdKeywords.filter(k => resumeKeywords.includes(k));
      const missingKeywords = jdKeywords.filter(k => !resumeKeywords.includes(k));

      const words = resumeText.toLowerCase().replace(/[^a-z0-9+#-]/g, ' ').split(/\s+/).filter(Boolean);
      const totalWords = words.length || 1;
      const keywordDensity = {};
      matchedKeywords.forEach(k => {
        const count = words.filter(w => w === k).length;
        keywordDensity[k] = parseFloat((count / totalWords).toFixed(4));
      });

      const score = resume.analysis?.keywordScore || (jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) : 50);

      res.json({
        success: true,
        score,
        matchedKeywords,
        missingKeywords,
        keywordDensity,
        recommendedKeywords: missingKeywords.slice(0, 10)
      });
    } catch (error) {
      console.error('Keywords endpoint error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async recruiter(req, res) {
    try {
      const resumeId = req.query.resumeId || req.body.resumeId;
      if (!resumeId) {
        return res.status(400).json({ success: false, message: 'Resume ID is required' });
      }

      const resume = await ResumeController.findResumeByIdentifier(resumeId);
      if (!resume) {
        return res.status(404).json({ success: false, message: 'Resume not found' });
      }

      const analysis = resume.analysis || {};
      const feedback = analysis.recruiterFeedback || {};

      res.json({
        success: true,
        confidence: analysis.recruiterConfidence || feedback.estimatedStrength || 'Medium',
        interviewReadiness: analysis.interviewReadiness || 'Medium',
        hiringProbability: analysis.hiringProbability || 50,
        overallVerdict: analysis.overallVerdict || 'Evaluating...',
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        criticalGaps: analysis.criticalGaps || [],
        priorityRecommendations: analysis.priorityRecommendations || analysis.improvementSuggestions || [],
        suggestedJobTitles: analysis.suggestedJobTitles || [],
        suggestedCompanyTypes: analysis.suggestedCompanyTypes || feedback.suitableCompanyTypes || [],
        industryFit: analysis.industryFit || 'Software Engineering'
      });
    } catch (error) {
      console.error('Recruiter endpoint error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getReport(req, res) {
    try {
      const { id } = req.params;

      // Get from MongoDB using helper method
      const resume = await ResumeController.findResumeByIdentifier(id);

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      res.json({
        success: true,
        data: resume
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get report'
      });
    }
  }

  static parseBasicInfo(text, detectedSkills) {
    const parsed = {
      name: '',
      email: '',
      phone: '',
      skills: [],
      projects: [],
      education: [],
      experience: [],
      certifications: [],
      languages: [],
      links: {
        github: '',
        linkedin: '',
        portfolio: ''
      }
    };

    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    // 1. Extract Name (scan first 10 non-empty lines for a capitalized sequence of 2-3 words, avoiding links/contact info)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      // Avoid lines with contact patterns
      if (
        line.includes('@') ||
        line.includes('http') ||
        line.includes('.com') ||
        line.includes('|') ||
        /\d/.test(line) ||
        /resume|cv|curriculum/i.test(line)
      ) {
        continue;
      }

      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        // Ensure words start with capitalized letters
        const isCapitalized = words.every(w => /^[A-Z][a-zA-Z]*$/.test(w));
        if (isCapitalized) {
          parsed.name = line;
          break;
        }
      }
    }

    // Fallback name if nothing found
    if (!parsed.name && lines.length > 0) {
      parsed.name = lines[0].substring(0, 30);
    }

    // 2. Extract email configuration snippet fallback setup placeholder link template pattern maps
    const emailRegex = /[\w.-]+@[\w.-]+\.[\w.-]+/i;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      parsed.email = emailMatch[0];
    }

    return parsed;
  }
}

module.exports = ResumeController;
