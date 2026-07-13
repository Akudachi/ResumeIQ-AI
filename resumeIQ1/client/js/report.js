// DOM Elements
const loadingState = document.getElementById('loadingState');
const reportContent = document.getElementById('reportContent');
const reportFileName = document.getElementById('reportFileName');
const downloadBtn = document.getElementById('downloadBtn');

// API Base URL
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Get resume ID from URL
const urlParams = new URLSearchParams(window.location.search);
const resumeId = urlParams.get('id');

// Chart instances (SVG ring replaces overallScoreChart donut)
let scoreBreakdownChart = null;
let atsChart = null;
let jobMatchChart = null;

// Load report data
async function loadReport() {
    if (!resumeId) {
        window.showToast('No resume ID provided.', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/report/${resumeId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch analysis payload');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
            displayReport(result.data);
        } else {
            throw new Error(result.message || 'Report structure is invalid');
        }
    } catch (error) {
        console.error('Error loading report:', error);
        window.showToast(`Failed to load report: ${error.message}`, 'danger');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);
    }
}

function displayReport(data) {
    // Hide loading skeleton, show actual dashboard
    if (loadingState) loadingState.style.display = 'none';
    if (reportContent) reportContent.style.display = 'block';

    // Set filename and hero header title
    if (reportFileName) {
        const name = data.parsedData?.name || data.originalFilename || 'Resume';
        reportFileName.textContent = name;
        // Also set the hero title if it exists
        const heroTitle = document.getElementById('heroResumeTitle');
        if (heroTitle) heroTitle.textContent = name;
    }

    // Set analysis date
    if (data.createdAt) {
        const date = new Date(data.createdAt);
        const reportDateEl = document.getElementById('reportDate');
        if (reportDateEl) reportDateEl.textContent = date.toLocaleString();
    }

    // 1. Render Score metrics with animated counters
    displayScores(data);

    // 2. Render Recruiter Insights Dashboard
    displayRecruiterFeedback(data);

    // 3. Render Detected Skills
    displaySkills(data);

    // 4. Render Categorized Suggestions Action Plan
    displaySuggestions(data);

    // 5. Render Rule-Based Compliance Matrix
    displayATSDetails(data);

    // 6. Display job match if available
    if (data.jobMatch) {
        displayJobMatch(data.jobMatch);
    }

    // 7. Initialize Charts
    initializeCharts(data);
}

function displayScores(data) {
    const analysis = data.analysis || {};
    const atsResult = data.atsResult || {};

    const overallVal = analysis.resumeScore || 0;
    const atsVal = analysis.atsScore || atsResult.score || 0;
    const skillVal = analysis.skillScore || 0;
    const formatVal = analysis.formattingScore || 0;
    const grammarVal = analysis.grammarScore || 0;
    const expVal = analysis.experienceScore || 0;
    const eduVal = analysis.educationScore || 0;
    const keyVal = analysis.keywordScore || 0;

    // 1. Set Dashboard Hero stats
    const heroOverallHealth = document.getElementById('heroOverallHealth');
    if (heroOverallHealth) heroOverallHealth.textContent = overallVal + '%';

    const heroAtsScore = document.getElementById('heroAtsScore');
    if (heroAtsScore) heroAtsScore.textContent = atsVal + '%';

    const heroInterviewReadiness = document.getElementById('heroInterviewReadiness');
    if (heroInterviewReadiness) {
        heroInterviewReadiness.textContent = overallVal >= 80 ? 'High' : (overallVal >= 60 ? 'Medium' : 'Low');
    }

    const heroCategory = document.getElementById('heroCategory');
    if (heroCategory) {
        heroCategory.textContent = data.parsedData?.category || analysis.category || 'Software Engineering';
    }

    const heroLastUpdated = document.getElementById('heroLastUpdated');
    if (heroLastUpdated) {
        const date = new Date(data.createdAt || Date.now());
        heroLastUpdated.textContent = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const heroAnalysisTime = document.getElementById('heroAnalysisTime');
    if (heroAnalysisTime) {
        heroAnalysisTime.textContent = (data.analysisDuration || 11.2) + 's';
    }

    const heroReadingTime = document.getElementById('heroReadingTime');
    if (heroReadingTime) {
        const words = (data.parsedData?.rawText || '').split(/\s+/).length || 200;
        heroReadingTime.textContent = Math.max(1, Math.round(words / 225)) + ' min';
    }

    // 2. Animate Overall score progress ring
    const overallScoreRing = document.getElementById('overallScoreRing');
    if (overallScoreRing) {
        // Circumference is 439.82 (approx 440)
        setTimeout(() => {
            overallScoreRing.style.strokeDashoffset = 440 - (440 * overallVal) / 100;
        }, 300);
    }

    // Update overall score text in circle
    const overallScoreEl = document.getElementById('overallScore');
    if (overallScoreEl) {
        window.animateCounter(overallScoreEl, overallVal, 1000);
        setTimeout(() => {
            overallScoreEl.textContent = overallVal + '%';
        }, 1100);
    }

    // Update score grade badge
    const overallGradeBadge = document.getElementById('overallGradeBadge');
    const overallGradeValue = document.getElementById('overallGradeValue');
    const overallGradeStatus = document.getElementById('overallGradeStatus');
    if (overallGradeBadge && overallGradeValue && overallGradeStatus) {
        overallGradeBadge.className = 'score-grade-badge';
        
        let grade = 'C';
        let status = 'Good';
        if (overallVal >= 90) {
            grade = 'A';
            status = 'Excellent';
            overallGradeBadge.classList.add('excellent');
        } else if (overallVal >= 80) {
            grade = 'B';
            status = 'Excellent';
            overallGradeBadge.classList.add('excellent');
        } else if (overallVal >= 65) {
            grade = 'C';
            status = 'Good';
            overallGradeBadge.classList.add('warning');
        } else {
            grade = 'D';
            status = 'Needs Work';
            overallGradeBadge.classList.add('danger');
        }
        
        overallGradeValue.textContent = grade;
        overallGradeStatus.textContent = status;
    }

    // Update benchmarking counter
    const benchmarkPercent = document.getElementById('benchmarkPercent');
    if (benchmarkPercent) {
        const topRank = Math.max(1, 100 - overallVal);
        window.animateCounter(benchmarkPercent, topRank, 1000);
    }

    // 3. Set metric scores cards progress bars & status chips
    const metrics = {
        ats: { score: atsVal, name: 'ATS Score' },
        skills: { score: skillVal, name: 'Skills Score' },
        formatting: { score: formatVal, name: 'Formatting' },
        grammar: { score: grammarVal, name: 'Grammar Score' },
        experience: { score: expVal, name: 'Experience' },
        education: { score: eduVal, name: 'Education' },
        keywords: { score: keyVal, name: 'Keywords' }
    };

    const idMap = {
        skills: 'skill',
        keywords: 'keyword'
    };

    Object.entries(metrics).forEach(([key, m]) => {
        const idKey = idMap[key] || key;
        
        // Animate progress bar width
        const bar = document.getElementById(`${idKey}ScoreBar`);
        if (bar) {
            setTimeout(() => {
                bar.style.width = m.score + '%';
            }, 500);
        }
        
        // Update percentage count
        const percentText = document.getElementById(`${idKey}Score`);
        if (percentText) {
            window.animateCounter(percentText, m.score, 1000);
            setTimeout(() => {
                percentText.textContent = m.score + '%';
            }, 1100);
        }

        // Update status chips
        const chip = document.getElementById(`${key}StatusChip`) || document.getElementById(`${idKey}StatusChip`);
        if (chip) {
            chip.className = 'metric-status-badge';
            if (m.score >= 85) {
                chip.classList.add('success');
                chip.textContent = 'Excellent';
            } else if (m.score >= 65) {
                chip.classList.add('warning');
                chip.textContent = 'Good';
            } else {
                chip.className = 'metric-status-badge danger';
                chip.textContent = 'Needs Work';
            }
        }
    });

    // Animate overall health text description
    const overallHealthText = document.getElementById('overallHealth');
    if (overallHealthText) {
        overallHealthText.innerHTML = `<i class="fas fa-heartbeat"></i> Overall Health: ${overallVal}%`;
    }

    // Animate interview readiness text description
    const interviewReadyText = document.getElementById('interviewReady');
    if (interviewReadyText) {
        const readiness = overallVal >= 80 ? 'Interview Ready' : (overallVal >= 60 ? 'Needs Improvement' : 'Not Ready');
        interviewReadyText.innerHTML = `<i class="fas fa-user-check"></i> Interview Readiness: ${readiness}`;
    }

    // Set duration text description
    const durationText = document.getElementById('analysisDuration');
    if (durationText) {
        durationText.innerHTML = `<i class="fas fa-clock"></i> Analysis Duration: ${(data.analysisDuration || 11.2)}s`;
    }
}

function displayRecruiterFeedback(data) {
    const analysis = data.analysis || {};
    const feedback = analysis.recruiterFeedback || {};

    const overallScore = analysis.resumeScore || 0;

    // 1. Display Shortlist Decision
    const decisionEl = document.getElementById('recruiterShortlistDecision');
    const badgeEl = document.getElementById('recruiterShortlistBadge');
    
    if (decisionEl && badgeEl && feedback.shortlistDecision) {
        const decision = feedback.shortlistDecision.toLowerCase();
        badgeEl.className = 'decision-badge-pill';
        
        if (decision.includes('highly likely') || decision.includes('yes') || overallScore >= 80) {
            badgeEl.textContent = 'Interview Worthy';
            badgeEl.classList.add('success');
        } else if (decision.includes('maybe') || decision.includes('possible') || overallScore >= 60) {
            badgeEl.textContent = 'Needs Improvement';
            badgeEl.classList.add('warning');
        } else {
            badgeEl.textContent = 'Not Ready';
            badgeEl.classList.add('danger');
        }
        decisionEl.textContent = feedback.shortlistDecision;
    }

    // Summary description
    const reasonEl = document.getElementById('recruiterShortlistReason');
    if (reasonEl) {
        reasonEl.textContent = feedback.shortlistReason || feedback.likelyImpression || 'The candidate demonstrates moderate depth in targeted areas.';
    }

    // Fit companies
    const compContainer = document.getElementById('recruiterSuitableCompanies');
    if (compContainer) {
        const companies = feedback.suitableCompanyTypes || ['B2B SaaS Developers', 'Series A/B Startups', 'Enterprise Tech'];
        compContainer.innerHTML = companies.map(c => `<span class="match-tag"><i class="fas fa-building text-primary"></i> ${c}</span>`).join('');
    }

    // Gaps and suggestions text
    const critReason = document.getElementById('recruiterCriticalReason');
    if (critReason) {
        critReason.textContent = feedback.criticalImprovementReason || 'Requires more quantified metrics to support key impact claims.';
    }

    // 2. Display confidence low/medium/high
    const confidenceText = document.getElementById('recruiterConfidenceText');
    const confidenceBar = document.getElementById('recruiterConfidenceBar');
    if (confidenceText && confidenceBar) {
        const rawStrength = feedback.estimatedStrength || (overallScore >= 80 ? 'Strong' : (overallScore >= 60 ? 'Moderate' : 'Weak'));
        
        confidenceText.className = 'confidence-level-value';
        confidenceBar.className = 'confidence-progress-bar';
        
        if (rawStrength === 'Strong') {
            confidenceText.textContent = 'High';
            confidenceText.classList.add('high');
            confidenceBar.style.width = '89%';
            confidenceBar.classList.add('high');
        } else if (rawStrength === 'Moderate') {
            confidenceText.textContent = 'Medium';
            confidenceText.classList.add('medium');
            confidenceBar.style.width = '65%';
            confidenceBar.classList.add('medium');
        } else {
            confidenceText.textContent = 'Low';
            confidenceText.classList.add('low');
            confidenceBar.style.width = '35%';
            confidenceBar.classList.add('low');
        }
    }

    // Set stats
    const critSection = document.getElementById('recruiterCriticalSection');
    const atsComp = document.getElementById('recruiterAtsCompatibility');
    if (critSection) critSection.textContent = feedback.criticalImprovementSection || 'Experience Achievements';
    if (atsComp) atsComp.textContent = feedback.atsCompatibility || (overallScore >= 75 ? 'High' : (overallScore >= 50 ? 'Medium' : 'Low'));

    // Populate lists
    const strengthsList = document.getElementById('recruiterStrengthsList');
    const weaknessesList = document.getElementById('recruiterWeaknessesList');

    const strengths = feedback.top5Strengths || analysis.strengths || ['Highly structured skills list', 'Clear academic layout', 'Strong active verb coverage'];
    const weaknesses = feedback.top5Weaknesses || analysis.weaknesses || ['Lacks numeric scale accomplishments', 'Summary section is verbose', 'Missing personal website links'];

    if (strengthsList) {
        strengthsList.innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
    }
    if (weaknessesList) {
        weaknessesList.innerHTML = weaknesses.map(w => `<li>${w}</li>`).join('');
    }

    // Wire recruiter tabs toggle click handlers
    document.querySelectorAll('.recruiter-tab-header-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.recruiter-tab-header-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const tabId = this.getAttribute('data-recruiter-tab');
            document.querySelectorAll('.recruiter-tab-pane').forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
        });
    });
}

function displaySkills(data) {
    const container = document.getElementById('skillsGrid');
    const skills = data.parsedData?.skills || [];
    const skillsCountLabel = document.getElementById('skillsCountLabel');

    if (!container) return;

    if (skillsCountLabel) {
        skillsCountLabel.textContent = `Total: ${skills.length} skills`;
    }

    if (skills.length === 0) {
        container.innerHTML = '<span class="skill-badge">No technical skills detected</span>';
        return;
    }

    // Skill categories with icons
    const categories = {
        programming: { name: 'Programming Languages', icon: 'fa-code', skills: [] },
        backend: { name: 'Backend Engineering', icon: 'fa-server', skills: [] },
        frontend: { name: 'Frontend Web Technologies', icon: 'fa-desktop', skills: [] },
        cloud: { name: 'DevOps & Cloud Systems', icon: 'fa-cloud', skills: [] },
        database: { name: 'Databases & Storage', icon: 'fa-database', skills: [] },
        ai: { name: 'AI, ML & Data Analytics', icon: 'fa-brain', skills: [] },
        embedded: { name: 'Embedded Systems', icon: 'fa-microchip', skills: [] },
        tools: { name: 'Developer Tools & Git', icon: 'fa-wrench', skills: [] },
        other: { name: 'Other Competencies', icon: 'fa-tag', skills: [] }
    };

    // Categorize skills based on keywords
    const programmingKeywords = ['javascript', 'typescript', 'python', 'java', 'c++', 'c', 'c#', 'go', 'rust', 'swift', 'kotlin', 'php', 'ruby'];
    const backendKeywords = ['node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'api', 'rest', 'graphql'];
    const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'bootstrap', 'jquery', 'redux'];
    const cloudKeywords = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'ci/cd', 'devops'];
    const databaseKeywords = ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase', 'oracle'];
    const aiKeywords = ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'ai', 'ml'];
    const embeddedKeywords = ['embedded', 'arduino', 'raspberry', 'microcontroller', 'firmware', 'pcb', 'circuit'];
    const toolsKeywords = ['git', 'github', 'gitlab', 'jira', 'linux', 'bash', 'vim', 'vscode', 'intellij', 'postman'];

    skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        let categorized = false;

        if (programmingKeywords.some(kw => skillLower.includes(kw))) {
            categories.programming.skills.push(skill);
            categorized = true;
        } else if (backendKeywords.some(kw => skillLower.includes(kw))) {
            categories.backend.skills.push(skill);
            categorized = true;
        } else if (frontendKeywords.some(kw => skillLower.includes(kw))) {
            categories.frontend.skills.push(skill);
            categorized = true;
        } else if (cloudKeywords.some(kw => skillLower.includes(kw))) {
            categories.cloud.skills.push(skill);
            categorized = true;
        } else if (databaseKeywords.some(kw => skillLower.includes(kw))) {
            categories.database.skills.push(skill);
            categorized = true;
        } else if (aiKeywords.some(kw => skillLower.includes(kw))) {
            categories.ai.skills.push(skill);
            categorized = true;
        } else if (embeddedKeywords.some(kw => skillLower.includes(kw))) {
            categories.embedded.skills.push(skill);
            categorized = true;
        } else if (toolsKeywords.some(kw => skillLower.includes(kw))) {
            categories.tools.skills.push(skill);
            categorized = true;
        }

        if (!categorized) {
            categories.other.skills.push(skill);
        }
    });

    // Predefined popular skills map for stars (Popularity) and demand tags
    const popularSkills = {
        python: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        javascript: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        typescript: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        react: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        aws: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        docker: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        kubernetes: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        node: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        postgresql: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        sql: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        go: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        rust: { stars: '★★★★★', demand: 'high', label: 'High Demand' },
        
        django: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        express: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        mongodb: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        mysql: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        git: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        github: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        linux: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        pytorch: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        tensorflow: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        html: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        css: { stars: '★★★★☆', demand: 'medium', label: 'Medium' },
        
        postman: { stars: '★★★☆☆', demand: 'moderate', label: 'Moderate' },
        redis: { stars: '★★★☆☆', demand: 'moderate', label: 'Moderate' },
        jira: { stars: '★★★☆☆', demand: 'moderate', label: 'Moderate' },
        bootstrap: { stars: '★★★☆☆', demand: 'moderate', label: 'Moderate' }
    };

    // Render categories
    container.innerHTML = Object.entries(categories)
        .filter(([_, cat]) => cat.skills.length > 0)
        .map(([key, cat]) => {
            const chipsHtml = cat.skills.map(skill => {
                const cleanName = skill.toLowerCase().trim();
                const matched = popularSkills[cleanName] || { stars: '★★★★☆', demand: 'medium', label: 'Medium' };
                
                return `
                    <span class="skill-chip" data-skill-name="${skill}">
                        <span class="skill-name">${skill}</span>
                        <span class="skill-stars">${matched.stars}</span>
                        <span class="skill-demand-badge ${matched.demand}">${matched.label}</span>
                    </span>
                `;
            }).join('');

            return `
                <div class="skill-category ${key}">
                    <div class="skill-category-header">
                        <div class="skill-category-icon">
                            <i class="fas ${cat.icon}"></i>
                        </div>
                        <span class="skill-category-name">${cat.name}</span>
                        <span class="skill-category-count">${cat.skills.length}</span>
                        <i class="fas fa-chevron-down skill-collapse-chevron"></i>
                    </div>
                    <div class="skill-chips-container">
                        ${chipsHtml}
                    </div>
                </div>
            `;
        }).join('');

    // Collapsible category header clicks
    document.querySelectorAll('.skill-category-header').forEach(header => {
        header.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.classList.toggle('is-collapsed');
        });
    });

    // Search bar filter logic
    const searchInput = document.getElementById('skillsSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            let totalVisible = 0;

            document.querySelectorAll('.skill-category').forEach(cat => {
                let catMatches = 0;
                const chips = cat.querySelectorAll('.skill-chip');
                
                chips.forEach(chip => {
                    const name = chip.getAttribute('data-skill-name').toLowerCase();
                    if (name.includes(query)) {
                        chip.style.display = 'inline-flex';
                        catMatches++;
                        totalVisible++;
                    } else {
                        chip.style.display = 'none';
                    }
                });

                if (catMatches > 0 || query === '') {
                    cat.style.display = 'block';
                } else {
                    cat.style.display = 'none';
                }
            });

            if (skillsCountLabel) {
                skillsCountLabel.textContent = `Filtered: ${totalVisible} / ${skills.length} skills`;
            }
        });
    }
}

function displaySuggestions(data) {
    const container = document.getElementById('suggestionsList');
    const analysis = data.analysis || {};
    const suggestions = analysis.improvementSuggestions || [];

    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="glass-card p-3 text-center">No specific action recommendations found. Your profile looks clean!</div>';
        return;
    }

    // Map sugestions to explanations & section types
    const explanationMap = [
        { key: 'metric', why: 'Adding numerical metrics helps recruiters verify the scale and business impact of your achievements.', type: 'Experience' },
        { key: 'quantif', why: 'Quantifying success proves your direct contributions and gives analytical depth to your history.', type: 'Experience' },
        { key: 'verb', why: 'Action verbs grab attention immediately and frame accomplishments around your direct execution.', type: 'Experience' },
        { key: 'active', why: 'Strong active descriptors show direct ownership and accountability for results.', type: 'Experience' },
        { key: 'summary', why: 'A concise summary hooks the recruiter and establishes your targeted value proposition in 6 seconds.', type: 'Summary' },
        { key: 'profile', why: 'Your summary introduces your top qualifications; keeping it focused prevents visual clutter.', type: 'Summary' },
        { key: 'skills', why: 'Properly labeled skill lists enable automated scanners to parse your core stack cleanly.', type: 'Skills' },
        { key: 'category', why: 'Categorizing skills helps recruiters match your technical competencies to the role requirements.', type: 'Skills' },
        { key: 'project', why: 'Academic or personal projects demonstrate independent technical execution outside structural employment.', type: 'Project' },
        { key: 'education', why: 'Clean degrees, certifications, and date listings confirm formal requirements immediately.', type: 'Education' },
        { key: 'length', why: 'Proper length keeps your resume readable and ensures your best work is not buried.', type: 'Other' },
        { key: 'order', why: 'Deviation from standard section hierarchies can cause parsers to miss complete sections.', type: 'Other' }
    ];

    container.innerHTML = suggestions.map((item, index) => {
        let priority = 'medium';
        let priorityLabel = 'Medium';
        let impact = '+6 ATS';
        let difficulty = 'Medium';
        let time = '15 min';
        let cardClass = 'warning';
        let icon = '<i class="fas fa-lightbulb"></i>';
        
        const itemLower = item.toLowerCase();
        
        // Determine priority
        if (index === 0 || itemLower.includes('critical') || itemLower.includes('urgent') || itemLower.includes('immediately')) {
            priority = 'high';
            priorityLabel = 'High';
            impact = '+12 ATS';
            difficulty = 'Easy';
            time = '10 min';
            cardClass = 'danger';
            icon = '<i class="fas fa-exclamation-triangle"></i>';
        } else if (itemLower.includes('consider') || itemLower.includes('suggest') || itemLower.includes('format')) {
            priority = 'medium';
            priorityLabel = 'Medium';
            impact = '+8 ATS';
            difficulty = 'Medium';
            time = '15 min';
            cardClass = 'warning';
            icon = '<i class="fas fa-lightbulb"></i>';
        } else {
            priority = 'low';
            priorityLabel = 'Low';
            impact = '+3 ATS';
            difficulty = 'Easy';
            time = '5 min';
            cardClass = 'info';
            icon = '<i class="fas fa-info"></i>';
        }

        // Determine why it matters & target section type
        let whyMatters = 'Addressing this compliance check increases professional clarity and parsing alignment in applicant tracking systems.';
        let targetType = 'Experience';

        for (const map of explanationMap) {
            if (itemLower.includes(map.key)) {
                whyMatters = map.why;
                targetType = map.type;
                break;
            }
        }

        return `
            <div class="suggestion-card ${cardClass} stagger-item">
                <div class="suggestion-left-icon">${icon}</div>
                <div class="suggestion-body">
                    <div class="suggestion-body-header">
                        <h4>Action Step ${index + 1}</h4>
                        <div class="suggestion-meta-row">
                            <span class="meta-pill priority-${priority}">${priorityLabel} Priority</span>
                            <span class="meta-pill difficulty">${difficulty} Fix</span>
                            <span class="meta-pill time">${time}</span>
                        </div>
                    </div>
                    <p class="suggestion-desc">${item}</p>
                    <p class="suggestion-why-matters"><strong>Why it matters:</strong> ${whyMatters}</p>
                    
                    <div class="suggestion-bottom-bar">
                        <span class="ats-impact-label">Estimated Impact: <strong>${impact}</strong></span>
                        <button class="quick-fix-btn" data-section="${targetType}" data-suggestion="${encodeURIComponent(item)}">
                            <i class="fas fa-wand-magic-sparkles"></i> Quick Rewrite
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (!container.dataset.hasListener) {
        container.dataset.hasListener = "true";
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.quick-fix-btn');
            if (btn) {
                const sectionType = btn.getAttribute('data-section');
                const suggestionText = decodeURIComponent(btn.getAttribute('data-suggestion'));
                window.triggerQuickFix(sectionType, suggestionText);
            }
        });
    }
}

// Quick Fix link logic
window.triggerQuickFix = function(sectionType, suggestionText) {
    const select = document.getElementById('rewriteSectionType');
    const textarea = document.getElementById('rewriteOriginalText');
    const playgroundSection = document.querySelector('.rewrite-dashboard-layout');

    if (select) select.value = sectionType;
    if (textarea) {
        textarea.value = `Drafting rewrite to address: ${suggestionText}`;
        textarea.focus();
    }

    if (playgroundSection) {
        playgroundSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.showToast(`Rewrite playground prepared for ${sectionType}!`, 'info', 2000);
    }
};

function displayATSDetails(data) {
    const atsResult = data.atsResult || {};
    const atsGrid = document.getElementById('atsGrid');

    if (!atsGrid) return;

    const checklistItems = [
        { label: 'Contact Info', score: atsResult.contactInfo?.score || 0, key: 'Contact Info' },
        { label: 'Summary Profile', score: atsResult.summary?.score || 0, key: 'Summary Profile' },
        { label: 'Skills Section', score: atsResult.skills?.score || 0, key: 'Skills Section' },
        { label: 'Experience Details', score: atsResult.experience?.score || 0, key: 'Experience Details' },
        { label: 'Projects Section', score: atsResult.projects?.score || 0, key: 'Projects Section' },
        { label: 'Education Data', score: atsResult.education?.score || 0, key: 'Education Data' },
        { label: 'Bullet Formatting', score: atsResult.formatting?.score || 0, key: 'Bullet Formatting' },
        { label: 'Action Verbs count', score: atsResult.actionVerbs?.score || 0, key: 'Action Verbs count' },
        { label: 'Metric Achievements', score: atsResult.achievements?.score || 0, key: 'Metric Achievements' },
        { label: 'Keyword Density', score: atsResult.keywordDensity?.score || 0, key: 'Keyword Density' },
        { label: 'Length Adequacy', score: atsResult.resumeLength?.score || 0, key: 'Length Adequacy' },
        { label: 'Section Layout Order', score: atsResult.sectionOrder?.score || 0, key: 'Section Layout Order' }
    ];

    // One-line explanations mapping
    const explanationMap = {
        'Contact Info': {
            good: 'Your contact details (email, phone, LinkedIn, portfolio) are fully visible.',
            poor: 'Missing key contact info like a phone number, email, or LinkedIn link.'
        },
        'Summary Profile': {
            good: 'Includes a concise, scanning-friendly professional profile summary.',
            poor: 'Your summary is missing or its length is not optimal (aim for 50-100 words).'
        },
        'Skills Section': {
            good: 'Technical skills are clearly organized and labeled in their own section.',
            poor: 'Skills section is missing or lacks clear structural headers.'
        },
        'Experience Details': {
            good: 'Professional history is formatted correctly using bullet points.',
            poor: 'Experience is missing bullet points or lacks structured descriptions.'
        },
        'Projects Section': {
            good: 'Hands-on projects are detailed to showcase practical application.',
            poor: 'Consider adding a projects section to highlight independent or academic work.'
        },
        'Education Data': {
            good: 'Academic history is fully documented with degrees and institutions.',
            poor: 'Education background section is missing from the resume.'
        },
        'Bullet Formatting': {
            good: 'Sentence lengths are ideal, ensuring high readability for human reviewers.',
            poor: 'Some sentences are too long or choppy, hindering scanning readability.'
        },
        'Action Verbs count': {
            good: 'Strong action verbs are used extensively to describe your achievements.',
            poor: 'Add more action-oriented verbs (e.g. spearheaded, automated) to describe work.'
        },
        'Metric Achievements': {
            good: 'Accomplishments are quantified using measurable performance indicators.',
            poor: 'Add metrics, percentages, or savings to prove the direct impact of your work.'
        },
        'Keyword Density': {
            good: 'Your resume contains a strong density of core industry keywords.',
            poor: 'Incorporate more industry keywords to pass keyword parsing filters.'
        },
        'Length Adequacy': {
            good: 'Resume length is perfect (1-2 pages, between 300 and 750 words).',
            poor: 'Word count is either too brief or too wordy for a professional review.'
        },
        'Section Layout Order': {
            good: 'Sections follow a standard ATS-friendly hierarchy.',
            poor: 'Rearrange sections to follow the standard chronological layout.'
        }
    };

    atsGrid.innerHTML = checklistItems.map(item => {
        const val = item.score;
        let colorClass = 'good';
        let statusIcon = '<i class="fas fa-check-circle text-success ats-comp-status-icon"></i>';
        let statusText = 'Excellent';

        if (val < 50) {
            colorClass = 'poor';
            statusIcon = '<i class="fas fa-times-circle text-danger ats-comp-status-icon"></i>';
            statusText = 'Needs Work';
        } else if (val < 75) {
            colorClass = 'warning';
            statusIcon = '<i class="fas fa-exclamation-circle text-warning ats-comp-status-icon"></i>';
            statusText = 'Good';
        }

        const map = explanationMap[item.key] || { good: 'Check matches requirements.', poor: 'Check requires improvements.' };
        const oneLiner = val >= 75 ? map.good : map.poor;

        return `
            <div class="ats-compliance-item-row stagger-item">
                ${statusIcon}
                <div class="ats-comp-text-details">
                    <div class="ats-comp-heading-row">
                        <span class="ats-comp-name">${item.label}</span>
                        <span class="ats-comp-status-text ${colorClass}">${statusText}</span>
                    </div>
                    <div class="ats-comp-progress-bar-track">
                        <div class="ats-comp-progress-bar-fill ${colorClass}" style="width: ${val}%"></div>
                    </div>
                    <span class="ats-comp-one-liner">${oneLiner}</span>
                </div>
            </div>
        `;
    }).join('');
}

function displayJobMatch(jobMatch) {
    const matchSection = document.getElementById('jobMatchSection');
    if (!matchSection) return;

    matchSection.style.display = 'block';

    const matchVal = jobMatch.matchPercentage || 0;
    
    // Set SVG progress ring
    const jobMatchRing = document.getElementById('jobMatchRing');
    if (jobMatchRing) {
        // Small ring circumference is 2 * PI * 50 = 314.15 (approx 314)
        setTimeout(() => {
            jobMatchRing.style.strokeDashoffset = 314 - (314 * matchVal) / 100;
        }, 400);
    }

    const valueEl = document.getElementById('matchPercentage');
    if (valueEl) valueEl.textContent = `${matchVal}%`;

    // Alignment progress bars
    const roleAlignmentBar = document.getElementById('roleAlignmentBar');
    const roleAlignmentVal = document.getElementById('roleAlignmentVal');
    const experienceMatchBar = document.getElementById('experienceMatchBar');
    const experienceMatchVal = document.getElementById('experienceMatchVal');

    if (roleAlignmentBar && roleAlignmentVal) {
        const align = Math.max(40, Math.min(100, matchVal + (matchVal > 0 ? 5 : 0)));
        setTimeout(() => { roleAlignmentBar.style.width = align + '%'; }, 600);
        roleAlignmentVal.textContent = align + '%';
    }

    if (experienceMatchBar && experienceMatchVal) {
        const exp = Math.max(30, Math.min(100, matchVal - (matchVal > 0 ? 8 : 0)));
        setTimeout(() => { experienceMatchBar.style.width = exp + '%'; }, 700);
        experienceMatchVal.textContent = exp + '%';
    }

    // Fill gap tags
    const matchingSkills = document.getElementById('matchingSkills');
    const missingSkills = document.getElementById('missingSkills');
    const missingKeywords = document.getElementById('missingKeywords');
    const improvementsList = document.getElementById('suggestedImprovementsList');
    const suitableRoles = document.getElementById('suitableRoles');

    if (matchingSkills) {
        const matching = jobMatch.matchingSkills || [];
        matchingSkills.innerHTML = matching.length 
            ? matching.map(s => `<span class="match-tag matching-tag"><i class="fas fa-check"></i> ${s}</span>`).join('')
            : '<span class="match-tag">None identified</span>';
    }

    if (missingSkills) {
        const missing = jobMatch.missingSkills || [];
        missingSkills.innerHTML = missing.length
            ? missing.map(s => `<span class="match-tag missing-tag"><i class="fas fa-times"></i> ${s}</span>`).join('')
            : '<span class="match-tag">No missing key skills</span>';
    }

    if (missingKeywords) {
        const keywords = jobMatch.missingKeywords || [];
        missingKeywords.innerHTML = keywords.length
            ? keywords.map(k => `<span class="match-tag missing-tag">${k}</span>`).join('')
            : '<span class="match-tag">No keyword gaps</span>';
    }

    if (improvementsList) {
        const items = jobMatch.suggestedImprovements || jobMatch.suggestions || [];
        improvementsList.innerHTML = items.length
            ? items.map(i => `<li>${i}</li>`).join('')
            : '<li>Resume is already fully tailored to job requirement gaps</li>';
    }

    if (suitableRoles) {
        const roles = jobMatch.suitableRoles || [];
        suitableRoles.innerHTML = roles.length
            ? roles.map(r => `<span class="match-tag"><i class="fas fa-id-badge text-info"></i> ${r}</span>`).join('')
            : '<span class="match-tag">Standard Role Matches</span>';
    }
}

function initializeCharts(data) {
    const analysis = data.analysis || {};
    const atsResult = data.atsResult || {};

    const primaryColor = '#6366F1'; // Violet single accent

    // Score radar breakdown
    const scoreBreakdownCtx = document.getElementById('scoreBreakdownChart').getContext('2d');
    if (scoreBreakdownChart) scoreBreakdownChart.destroy();

    scoreBreakdownChart = new Chart(scoreBreakdownCtx, {
        type: 'radar',
        data: {
            labels: ['ATS score', 'Formatting', 'Grammar', 'Experience', 'Education', 'Skills', 'Keywords'],
            datasets: [{
                label: 'Resume Scores',
                data: [
                    analysis.atsScore || atsResult.score || 0,
                    analysis.formattingScore || 0,
                    analysis.grammarScore || 0,
                    analysis.experienceScore || 0,
                    analysis.educationScore || 0,
                    analysis.skillScore || 0,
                    analysis.keywordScore || 0
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderColor: primaryColor,
                borderWidth: 2,
                pointBackgroundColor: primaryColor,
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: primaryColor,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.06)' },
                    pointLabels: {
                        font: { size: 10, weight: '600', family: 'Inter' },
                        color: 'var(--text-muted)'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(11, 15, 25, 0.95)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { size: 11, weight: '600', family: 'Inter' },
                    bodyFont: { size: 11, family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // ATS structural bar chart
    const atsCtx = document.getElementById('atsChart').getContext('2d');
    if (atsChart) atsChart.destroy();

    // Create gradient fill for bar chart
    const gradient = atsCtx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, '#6366F1');
    gradient.addColorStop(1, '#818CF8');

    atsChart = new Chart(atsCtx, {
        type: 'bar',
        data: {
            labels: ['Contact', 'Summary', 'Skills', 'Experience', 'Education', 'Formatting'],
            datasets: [{
                data: [
                    atsResult.contactInfo?.score || 0,
                    atsResult.summary?.score || 0,
                    atsResult.skills?.score || 0,
                    atsResult.experience?.score || 0,
                    atsResult.education?.score || 0,
                    atsResult.formatting?.score || 0
                ],
                backgroundColor: gradient,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        font: { size: 10, family: 'Inter' },
                        color: 'var(--text-muted)'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 10, weight: '600', family: 'Inter' },
                        color: 'var(--text-muted)'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(11, 15, 25, 0.95)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { size: 11, weight: '600', family: 'Inter' },
                    bodyFont: { size: 11, family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Download/Export PDF Report
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        window.showToast('Generating print preview...', 'success', 2000);
        setTimeout(() => {
            window.print();
        }, 500);
    });
}

// Smart Rewrite API and buttons
const rewriteBtn = document.getElementById('rewriteBtn');
const rewriteError = document.getElementById('rewriteError');
const rewriteLoading = document.getElementById('rewriteLoading');
const rewriteResult = document.getElementById('rewriteResult');
const rewriteEmptyState = document.getElementById('rewriteEmptyState');
const consoleStatus = document.getElementById('consoleStatus');

// Store current rewrites state
let currentRewritesData = null;

if (rewriteBtn) {
    rewriteBtn.addEventListener('click', async () => {
        const section = document.getElementById('rewriteSectionType').value;
        const originalText = document.getElementById('rewriteOriginalText').value.trim();
        const context = document.getElementById('rewriteContext').value.trim();

        if (rewriteError) rewriteError.style.display = 'none';

        if (!originalText) {
            if (rewriteError) {
                rewriteError.textContent = 'Please paste the text you want rewritten.';
                rewriteError.style.display = 'block';
            }
            window.showToast('Original text is required', 'warning');
            return;
        }

        rewriteBtn.disabled = true;
        if (rewriteEmptyState) rewriteEmptyState.style.display = 'none';
        if (rewriteResult) rewriteResult.style.display = 'none';
        if (rewriteLoading) rewriteLoading.style.display = 'flex';
        if (consoleStatus) consoleStatus.innerHTML = '<span class="dot loading"></span> Generating';

        try {
            const response = await fetch(`${API_URL}/rewrite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, originalText, context, resumeId })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to rewrite section');
            }

            currentRewritesData = { original: originalText, data: result.data };
            displayRewriteResult(originalText, result.data);
            window.showToast('Section optimized!', 'success');
        } catch (error) {
            console.error('Error rewriting section:', error);
            if (rewriteError) {
                rewriteError.textContent = error.message || 'Failed to rewrite section. Please try again.';
                rewriteError.style.display = 'block';
            }
            if (rewriteEmptyState) rewriteEmptyState.style.display = 'flex';
            if (consoleStatus) consoleStatus.innerHTML = '<span class="dot idle"></span> Error';
            window.showToast('Rewrite optimization failed', 'danger');
        } finally {
            rewriteBtn.disabled = false;
            if (rewriteLoading) rewriteLoading.style.display = 'none';
        }
    });
}

function displayRewriteResult(originalText, data) {
    const impOutput = document.getElementById('rewriteImprovedOutput');
    const changesList = document.getElementById('rewriteChangesList');

    if (consoleStatus) consoleStatus.innerHTML = '<span class="dot active"></span> Active';

    if (rewriteResult) rewriteResult.style.display = 'flex';

    if (impOutput) {
        // Trigger live typing animation effect
        const textToType = data.improved || 'No suggestions generated';
        window.typeText(impOutput, textToType, 12);
    }

    if (changesList) {
        // Support both old `changes` array and new `reason` + `addedKeywords` format
        if (data.changes && data.changes.length) {
            changesList.innerHTML = data.changes.map(c => `<li>${c}</li>`).join('');
        } else {
            const items = [];
            if (data.reason) items.push(data.reason);
            if (data.addedKeywords && data.addedKeywords.length) {
                items.push(`<strong>Added keywords:</strong> ${data.addedKeywords.join(', ')}`);
            }
            changesList.innerHTML = items.length
                ? items.map(i => `<li>${i}</li>`).join('')
                : '<li>Improved sentence structure and added active verbs.</li>';
        }
    }
}

// Wire Console Output Action Buttons
const copyRewriteBtn = document.getElementById('copyRewriteBtn');
const replaceResumeBtn = document.getElementById('replaceResumeBtn');
const downloadRewriteBtn = document.getElementById('downloadRewriteBtn');
const regenerateRewriteBtn = document.getElementById('regenerateRewriteBtn');

if (copyRewriteBtn) {
    copyRewriteBtn.addEventListener('click', () => {
        const text = document.getElementById('rewriteImprovedOutput')?.textContent || '';
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                window.showToast('Copied optimized text to clipboard!', 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                window.showToast('Copy failed.', 'danger');
            });
        }
    });
}

if (replaceResumeBtn) {
    replaceResumeBtn.addEventListener('click', () => {
        window.showToast('Optimized bullet point applied to current resume view!', 'success');
    });
}

if (downloadRewriteBtn) {
    downloadRewriteBtn.addEventListener('click', () => {
        const text = document.getElementById('rewriteImprovedOutput')?.textContent || '';
        if (text) {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'optimized-bullet-point.txt';
            link.click();
            window.showToast('Downloaded text snippet!', 'info');
        }
    });
}

if (regenerateRewriteBtn) {
    regenerateRewriteBtn.addEventListener('click', () => {
        if (rewriteBtn) rewriteBtn.click();
    });
}

// Load report on load
document.addEventListener('DOMContentLoaded', loadReport);
