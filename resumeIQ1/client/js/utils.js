/**
 * ResumeIQ Shared UI Utilities
 */

// Toast System
window.showToast = function(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '<i class="fas fa-info-circle toast-icon"></i>';
  if (type === 'success') icon = '<i class="fas fa-check-circle toast-icon"></i>';
  if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
  if (type === 'danger') icon = '<i class="fas fa-times-circle toast-icon"></i>';

  toast.innerHTML = `
    ${icon}
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);
  
  // Trigger entry animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

// Counter Animation
window.animateCounter = function(element, target, duration = 1500) {
  if (!element) return;
  const start = 0;
  const range = target - start;
  const increment = target > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range)) || 10;
  
  let current = start;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;
    if (current == target) {
      clearInterval(timer);
    }
  }, stepTime);
};

// Button Ripple Effect
window.initButtonRipples = function() {
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      // Avoid creating multiple ripples on double clicks quickly
      const existingRipple = this.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
};

// Dark Mode Handling
window.initDarkModeToggle = function() {
  const currentTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Find all dark mode toggles in DOM (nav, header, etc.)
  document.querySelectorAll('.dark-mode-toggle').forEach(toggle => {
    // Add correct icon initially
    const isDark = document.documentElement.classList.contains('dark');
    toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    toggle.addEventListener('click', () => {
      const active = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', active ? 'dark' : 'light');
      
      // Update all toggle icons on the page
      document.querySelectorAll('.dark-mode-toggle').forEach(t => {
        t.innerHTML = active ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
      
      window.showToast(`Switched to ${active ? 'Dark' : 'Light'} Mode`, 'info', 2000);
    });
  });
};

// Scroll Reveal
window.initScrollReveal = function() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
};

// SVG Loading Steps Timers
window.setupProcessingTimeline = function(timelineStepsContainer, callback) {
  if (!timelineStepsContainer) return;
  
  const steps = [
    { id: 'upload_resume', text: 'Uploading Resume', duration: 2000 },
    { id: 'extract_resume', text: 'Extracting Resume', duration: 2000 },
    { id: 'extract_jd', text: 'Extracting Job Description', duration: 2000 },
    { id: 'finding_skills', text: 'Finding Skills', duration: 2000 },
    { id: 'matching_keywords', text: 'Matching Keywords', duration: 2000 },
    { id: 'running_ats', text: 'Running ATS Engine', duration: 2000 },
    { id: 'recruiter_sim', text: 'Recruiter Simulation', duration: 2000 },
    { id: 'generating_recs', text: 'Generating Recommendations', duration: 2000 },
    { id: 'finalizing_dash', text: 'Finalizing Dashboard', duration: 2000 }
  ];

  timelineStepsContainer.innerHTML = '';
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
  let startTime = Date.now();

  // Create UI steps
  const stepElements = steps.map((step, idx) => {
    const el = document.createElement('div');
    el.className = 'timeline-step';
    el.innerHTML = `
      <div class="step-indicator">
        <i class="fas fa-circle-notch fa-spin step-spinner"></i>
        <i class="fas fa-check step-check" style="display:none;"></i>
      </div>
      <span class="step-text">${step.text}</span>
    `;
    timelineStepsContainer.appendChild(el);
    return { ...step, el };
  });

  // Create a timer display if present
  const timerDisplay = document.getElementById('estimatedTimer');
  
  const updateTimer = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
    if (timerDisplay) {
      timerDisplay.textContent = `Estimated remaining time: ~${remaining} seconds`;
    }
    if (remaining > 0) {
      requestAnimationFrame(updateTimer);
    }
  };
  requestAnimationFrame(updateTimer);

  // Animate steps sequentially
  let currentIdx = 0;

  const runStep = () => {
    if (currentIdx >= steps.length) {
      if (callback) callback();
      return;
    }

    const current = stepElements[currentIdx];
    current.el.classList.add('active');

    setTimeout(() => {
      // Mark current as complete
      current.el.classList.remove('active');
      current.el.classList.add('completed');
      const spinner = current.el.querySelector('.step-spinner');
      const check = current.el.querySelector('.step-check');
      if (spinner) spinner.style.display = 'none';
      if (check) check.style.display = 'block';

      currentIdx++;
      runStep();
    }, current.duration);
  };

  runStep();
};

// Smooth transitions on click anchors
window.initSmoothTransitions = function() {
  document.querySelectorAll('a').forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (href && href.endsWith('.html') && !anchor.getAttribute('target')) {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        let overlay = document.querySelector('.page-transition-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'page-transition-overlay';
          document.body.appendChild(overlay);
        }
        
        overlay.classList.add('active');
        
        setTimeout(() => {
          window.location.href = href;
        }, 550);
      });
    }
  });

  // Fade out transition overlay on page load
  window.addEventListener('load', () => {
    const overlay = document.querySelector('.page-transition-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
      }, 600);
    }
  });
};

// Mobile Navigation Drawer Toggle
window.initMobileNavigation = function() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
};

// Initialize elements common to pages
document.addEventListener('DOMContentLoaded', () => {
  window.initButtonRipples();
  window.initDarkModeToggle();
  window.initScrollReveal();
  window.initSmoothTransitions();
  window.initMobileNavigation();
});

// Live AI Text Typing Effect Utility
window.typeText = function(element, text, speed = 10, onComplete = null) {
  if (!element) return;
  element.textContent = '';
  let i = 0;
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      if (onComplete) onComplete();
    }
  }
  type();
};
