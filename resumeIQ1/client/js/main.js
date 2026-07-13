// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const uploadSuccess = document.getElementById('uploadSuccess');
const uploadedFileName = document.getElementById('uploadedFileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const removeBtn = document.getElementById('removeBtn');
const jobMatchSection = document.getElementById('jobMatchSection');
const jobDescription = document.getElementById('jobDescription');
const skipJobMatch = document.getElementById('skipJobMatch');
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');

// State
let selectedFile = null;
let resumeId = null;

// API Base URL
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

// Navigation Toggle
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu on links click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) navMenu.classList.remove('active');
    });
});

// File Upload Handling
if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

if (uploadArea) {
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.ms-office'
    ];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.pdf', '.doc', '.docx'];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
        window.showToast('Please upload a PDF or Word document (.doc, .docx).', 'danger');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        window.showToast('File size must be less than 5MB.', 'warning');
        return;
    }

    selectedFile = file;
    uploadFile(file);
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    
    if (sessionStorage.getItem('bypassValidation') === 'true') {
        formData.append('bypassValidation', 'true');
        sessionStorage.removeItem('bypassValidation');
    }

    uploadArea.style.display = 'none';
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';

    const stepsContainer = document.getElementById('timelineSteps');
    if (stepsContainer) {
        stepsContainer.innerHTML = '<div class="timeline-step active"><div class="step-indicator"><i class="fas fa-circle-notch fa-spin step-spinner"></i></div><span class="step-text">Uploading and extracting resume text...</span></div>';
    }

    let percentage = 0;
    const progressInterval = setInterval(() => {
        percentage += 10;
        if (percentage >= 90) clearInterval(progressInterval);
        progressFill.style.width = `${percentage}%`;
    }, 150);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
            if (result.validation) {
                const validation = result.validation;
                const message = `Invalid Document: ${validation.detectedType} (${validation.confidence}% confidence) - ${validation.reason}`;
                window.showToast(message, 'danger', 6000);
                resetUpload();
                return;
            }
            throw new Error(result.message || `Upload failed (status ${response.status})`);
        }

        resumeId = result.resumeId;
        uploadedFileName.textContent = file.name;

        setTimeout(() => {
            uploadProgress.style.display = 'none';
            uploadSuccess.style.display = 'block';
            jobMatchSection.style.display = 'block';
            window.showToast('Resume uploaded and content parsed!', 'success');
            validateInputs();
        }, 600);

    } catch (error) {
        console.error('Upload error:', error);
        window.showToast(`Failed to parse resume: ${error.message}`, 'danger');
        resetUpload();
    }
}

function resetUpload() {
    selectedFile = null;
    resumeId = null;
    uploadArea.style.display = 'flex';
    uploadProgress.style.display = 'none';
    uploadSuccess.style.display = 'none';
    jobMatchSection.style.display = 'none';
    fileInput.value = '';
    jobDescription.value = '';
    
    const jdFileInput = document.getElementById('jdFileInput');
    const jdFileName = document.getElementById('jdFileName');
    if (jdFileInput) jdFileInput.value = '';
    if (jdFileName) {
        jdFileName.textContent = '';
        jdFileName.style.display = 'none';
    }
    validateInputs();
}

function validateInputs() {
    if (!analyzeBtn) return;
    const hasResume = !!resumeId;
    const hasJD = !!jobDescription.value.trim();
    if (hasResume && hasJD) {
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
        analyzeBtn.style.cursor = 'pointer';
    } else {
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = '0.6';
        analyzeBtn.style.cursor = 'not-allowed';
    }
}

if (jobDescription) {
    jobDescription.addEventListener('input', validateInputs);
    jobDescription.addEventListener('change', validateInputs);
}

// Job Description File Upload handling
const jdBrowseBtn = document.getElementById('jdBrowseBtn');
const jdFileInput = document.getElementById('jdFileInput');
const jdFileName = document.getElementById('jdFileName');

if (jdBrowseBtn && jdFileInput) {
    jdBrowseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        jdFileInput.click();
    });
}

if (jdFileInput) {
    jdFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                window.showToast('File size must be less than 5MB.', 'warning');
                return;
            }
            
            const formData = new FormData();
            formData.append('jd', file);
            
            jdBrowseBtn.disabled = true;
            jdBrowseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing...';
            if (jdFileName) {
                jdFileName.textContent = `Reading ${file.name}...`;
                jdFileName.style.display = 'inline';
            }
            
            try {
                const response = await fetch(`${API_URL}/parse-jd`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Failed to parse Job Description file');
                }
                
                jobDescription.value = result.text;
                if (jdFileName) {
                    jdFileName.textContent = `✓ ${file.name}`;
                }
                window.showToast('Job Description file parsed successfully!', 'success');
                validateInputs();
            } catch (error) {
                console.error('JD upload error:', error);
                window.showToast(`Failed to parse JD file: ${error.message}`, 'danger');
                if (jdFileName) jdFileName.style.display = 'none';
            } finally {
                jdBrowseBtn.disabled = false;
                jdBrowseBtn.innerHTML = '<i class="fas fa-file-upload"></i> Upload Job Description File';
            }
        }
    });
}

// Analyze Button trigger
if (analyzeBtn) {
    validateInputs();
    analyzeBtn.addEventListener('click', async () => {
        if (!resumeId) {
            window.showToast('Please upload your resume.', 'danger');
            return;
        }

        const jobDesc = jobDescription.value.trim();
        if (!jobDesc) {
            window.showToast('Please upload or paste a Job Description.', 'danger');
            return;
        }

        // Hide success card and job match section
        uploadSuccess.style.display = 'none';
        jobMatchSection.style.display = 'none';
        
        // Show progress stepper
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';

        let stepsFinished = false;
        let apiFinished = false;
        
        const stepsContainer = document.getElementById('timelineSteps');
        window.setupProcessingTimeline(stepsContainer, () => {
            stepsFinished = true;
            if (apiFinished) {
                redirectToReport();
            }
        });

        // Animate progress fill bar smoothly over 18 seconds
        let percentage = 0;
        const progressInterval = setInterval(() => {
            percentage += 1;
            progressFill.style.width = `${percentage}%`;
            if (percentage >= 98) {
                clearInterval(progressInterval);
            }
        }, 180);

        function redirectToReport() {
            window.showToast('Analysis complete! Preparing dashboard...', 'success');
            let overlay = document.querySelector('.page-transition-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'page-transition-overlay';
                document.body.appendChild(overlay);
            }
            overlay.classList.add('active');

            setTimeout(() => {
                window.location.href = `report.html?id=${resumeId}`;
            }, 600);
        }

        try {
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumeId: resumeId,
                    jobDescription: jobDesc
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Analysis failed (status ${response.status})`);
            }

            apiFinished = true;
            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            if (stepsFinished) {
                redirectToReport();
            }

        } catch (error) {
            console.error('Analysis error:', error);
            window.showToast(`AI audit failed: ${error.message}`, 'danger');
            
            // Restore elements on error
            uploadProgress.style.display = 'none';
            uploadSuccess.style.display = 'block';
            jobMatchSection.style.display = 'block';
            validateInputs();
        }
    });
}

// Remove Button
if (removeBtn) {
    removeBtn.addEventListener('click', () => {
        resetUpload();
        window.showToast('File removed.', 'info');
    });
}


// FAQ Accordion Toggles
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close other items
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            // Open clicked
            if (!isActive) {
                item.classList.add('active');
            }
        });
    }
});

// Smooth Scroll to anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effects
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 40) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
});

// Trigger counter animations when stat-numbers enter screen
document.addEventListener('DOMContentLoaded', () => {
    const statSection = document.querySelector('.hero-stats');
    if (statSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.counter-val').forEach(counter => {
                        const target = parseInt(counter.getAttribute('data-target'), 10);
                        window.animateCounter(counter, target, 1200);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(statSection);
    }
});