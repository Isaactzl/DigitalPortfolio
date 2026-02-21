/* ========================================
   ISAAC.DEV - Portfolio JavaScript
   Interactive Features & Animations
   ======================================== */

// ========================================
// TERMINAL LOADER
// ========================================
function initTerminalLoader() {
    const terminalLoader = document.getElementById('terminal-loader');
    const terminalOutput = document.getElementById('terminal-output');
    
    if (!terminalLoader || !terminalOutput) return;
    
    // Fallback: auto-hide loader if it gets stuck
    setTimeout(() => {
        if (terminalLoader.classList.contains('active')) {
            terminalLoader.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }, 10000);
    
    const commands = [
        { text: '> INITIALIZING SYSTEM...', delay: 100 },
        { text: '> LOADING MODULES...', delay: 200 },
        { text: '> MODULE: portfolio.js [OK]', delay: 150 },
        { text: '> MODULE: projects.js [OK]', delay: 150 },
        { text: '> MODULE: skills.js [OK]', delay: 150 },
        { text: '> COMPILING ASSETS...', delay: 200 },
        { text: '> ESTABLISHING CONNECTION...', delay: 200 },
        { text: '> CONNECTION ESTABLISHED', delay: 150 },
        { text: '> LAUNCHING PORTFOLIO v1.0.0', delay: 200 },
        { text: '> WELCOME, USER.', delay: 100 }
    ];
    
    let currentLine = 0;
    
    function typeCommand() {
        if (currentLine < commands.length) {
            const command = commands[currentLine];
            const line = document.createElement('div');
            line.textContent = command.text;
            line.style.opacity = '0';
            terminalOutput.appendChild(line);
            
            setTimeout(() => {
                line.style.transition = 'opacity 0.1s';
                line.style.opacity = '1';
            }, 10);
            
            currentLine++;
            setTimeout(typeCommand, command.delay);
        } else {
            setTimeout(() => {
                terminalLoader.classList.remove('active');
                // Enable body scroll
                document.body.style.overflow = 'auto';
            }, 500);
        }
    }
    
    // Start animation
    document.body.style.overflow = 'hidden';
    setTimeout(typeCommand, 300);
}

// Run terminal loader when the loader element exists (works on GitHub Pages subpaths)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('terminal-loader')) {
        window.addEventListener('load', initTerminalLoader);
    }
});

// ========================================
// NAVIGATION ACTIVE STATE
// ========================================
function updateActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.remove('active');
        
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

updateActiveNav();

// ========================================
// BANNER SLIDER
// ========================================
function initBannerSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dots .dot');
    const prevBtn = document.querySelector('.banner-btn.prev');
    const nextBtn = document.querySelector('.banner-btn.next');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function showSlide(index) {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current
        slides[index].classList.add('active');
        if (dots[index]) {
            dots[index].classList.add('active');
        }
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });
    
    // Auto-advance every 5 seconds
    setInterval(nextSlide, 5000);
}

initBannerSlider();

// ========================================
// PROJECT FILTERING
// ========================================
function initProjectFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-detail');
    
    if (filterBtns.length === 0 || projects.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter projects
            projects.forEach(project => {
                const categories = project.getAttribute('data-category') || '';
                
                if (filter === 'all') {
                    project.classList.remove('hidden');
                    setTimeout(() => {
                        project.style.opacity = '1';
                        project.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    if (categories.includes(filter)) {
                        project.classList.remove('hidden');
                        setTimeout(() => {
                            project.style.opacity = '1';
                            project.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        project.style.opacity = '0';
                        project.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            project.classList.add('hidden');
                        }, 250);
                    }
                }
            });
        });
    });
}

initProjectFilter();

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
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

// ========================================
// INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
// ========================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements
    const animatedElements = document.querySelectorAll(
        '.skill-card, .project-preview, .spec-card, .timeline-item, .project-detail'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
}

// Initialize scroll animations after a short delay
setTimeout(initScrollAnimations, 100);

// ========================================
// FUCHSIA GLOW EFFECT ON MOUSE MOVE
// ========================================
function initGlowEffect() {
    const cards = document.querySelectorAll(
        '.skill-card, .project-preview, .spec-card, .project-detail'
    );
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

initGlowEffect();

// ========================================
// DYNAMIC YEAR IN FOOTER
// ========================================
function updateCopyrightYear() {
    const year = new Date().getFullYear();
    const copyrightText = document.querySelector('.footer .mono');
    if (copyrightText) {
        copyrightText.textContent = `© ${year} Isaac.dev // Crafted with precision`;
    }
}

updateCopyrightYear();

// ========================================
// TYPING EFFECT FOR HERO TITLE (Alternative)
// ========================================
function initTypingEffect() {
    const typingElements = document.querySelectorAll('[data-typing]');
    
    typingElements.forEach(element => {
        const text = element.getAttribute('data-typing');
        const speed = parseInt(element.getAttribute('data-typing-speed')) || 50;
        let i = 0;
        
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    });
}

// ========================================
// PARTICLE BACKGROUND (Optional Enhancement)
// ========================================
function createParticleBackground() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.3';
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function init() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Connect particles
        particles.forEach((particleA, indexA) => {
            particles.slice(indexA + 1).forEach(particleB => {
                const dx = particleA.x - particleB.x;
                const dy = particleA.y - particleB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(255, 0, 255, ${1 - distance / 100})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particleA.x, particleA.y);
                    ctx.lineTo(particleB.x, particleB.y);
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    init();
    animate();
}

// Optional: Uncomment to enable particle background
// createParticleBackground();

// ========================================
// MOBILE MENU TOGGLE (if needed)
// ========================================
function initMobileMenu() {
    const nav = document.querySelector('.nav-links');
    const navToggle = document.createElement('button');
    navToggle.classList.add('nav-toggle');
    navToggle.innerHTML = '☰';
    navToggle.setAttribute('aria-label', 'Toggle navigation');
    
    // Only add mobile menu on small screens
    if (window.innerWidth <= 640) {
        const navContent = document.querySelector('.nav-content');
        navContent.insertBefore(navToggle, nav);
        
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            navToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });
    }
}

// ========================================
// KEYBOARD NAVIGATION ENHANCEMENTS
// ========================================
function initKeyboardNav() {
    // Add keyboard support for slider
    const prevBtn = document.querySelector('.banner-btn.prev');
    const nextBtn = document.querySelector('.banner-btn.next');
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && prevBtn) {
            prevBtn.click();
        } else if (e.key === 'ArrowRight' && nextBtn) {
            nextBtn.click();
        }
    });
}

initKeyboardNav();

// ========================================
// LAZY LOADING IMAGES (if real images are added)
// ========================================
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

initLazyLoading();

// ========================================
// PROJECT DETAIL MODAL SYSTEM
// ========================================
const projectData = {
    'zypher-ebike': {
        title: 'ZYPHER E-Bike Landing Page',
        description: 'An immersive landing page for ZYPHER E-Bike featuring interactive 3D models, smooth animations, and modern web design. Built to showcase the product with engaging visual elements.',
        images: [
            { src: 'images/ZYPHER/ZYPHER_TN.png', alt: 'Main landing page with 3D model' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/v_PU21hG4OA',
        features: [
            'Interactive 3D bike model',
            'Smooth scroll animations',
            'Product feature showcase',
            'Mobile-first responsive design',
            'Modern UI/UX design',
            'Performance optimized'
        ],
        tech: [
            'HTML5 & CSS3',
            'JavaScript for 3D interactions',
            'Three.js for 3D models',
            'GSAP for animations',
            'Responsive design',
            'WebGL optimization'
        ],
        demoUrl: 'https://youtu.be/v_PU21hG4OA'
    },
    'chikia': {
        title: 'CHIKIA - Story-Based Adventure',
        description: 'An immersive story-driven game featuring multiple minigames and interactive narratives. Players explore different worlds while engaging in various challenges and puzzles.',
        images: [
            { src: 'images/CHIKIA/Chikia_TN.png', alt: 'Story-driven adventure game' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/6McchUiTS6A',
        features: [
            'Multiple interconnected minigames',
            'Rich story narrative',
            'Character progression system',
            'Interactive dialogue system',
            'Multiple world environments',
            'Achievement system'
        ],
        tech: [
            'Unity 3D game engine',
            'C# scripting',
            'Unity UI system',
            'Scriptable Objects for data',
            'Audio system integration',
            'Save/Load system'
        ],
        demoUrl: 'https://youtu.be/6McchUiTS6A'
    },
    'galactic-heist': {
        title: 'Galactic Heist - Live Web App',
        description: 'A dynamic web application with real-time interactions and live updating challenges. Features multiplayer elements and live data synchronization for an engaging user experience.',
        images: [
            { src: 'images/Galactic Heist/Galactic_Heist_FrontPage.png', alt: 'Main application interface' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/ivauQLJwhJQ',
        features: [
            'Real-time data synchronization',
            'Live updating challenges',
            'Interactive user interface',
            'Multiplayer elements',
            'Dynamic content loading',
            'Responsive design'
        ],
        tech: [
            'React.js frontend',
            'Node.js backend',
            'WebSocket connections',
            'Real-time database',
            'Express.js server',
            'Mobile optimization'
        ],
        demoUrl: 'https://youtu.be/ivauQLJwhJQ'
    },
    'hdb-cats': {
        title: 'HDB Cats - 3D Tower Defense',
        description: 'A strategic 3D tower defense game set in Singapore\'s HDB environment. Players defend their neighborhood using various cat units with unique abilities and strategic positioning.',
        images: [
            { src: 'images/HDB Cats/HDB_Cats_TN.png', alt: 'Tower defense gameplay' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/dtA3vYOva8c',
        features: [
            '3D tower defense mechanics',
            'Multiple cat unit types',
            'Strategic positioning system',
            'Wave-based enemy spawning',
            'Upgrade and progression system',
            'Singapore HDB setting'
        ],
        tech: [
            'Unity 3D game engine',
            'C# scripting',
            '3D pathfinding algorithms',
            'Unity UI system',
            'Particle effects',
            'Audio system integration'
        ],
        demoUrl: 'https://youtu.be/dtA3vYOva8c'
    },
    'stock-sensei': {
        title: 'Stock Sensei - Financial Education',
        description: 'An educational platform designed to make stock market learning accessible and fun. Features interactive lessons, real-time market data, and gamified learning experiences.',
        images: [
            { src: 'images/StockSensei/StockSensei_TN.png', alt: 'Main dashboard view' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/Xr_YEtSqxVg',
        features: [
            'Interactive financial lessons',
            'Real-time market data',
            'Gamified learning system',
            'Stock tracking capabilities',
            'Educational content library',
            'Progress tracking'
        ],
        tech: [
            'React.js frontend',
            'Node.js backend',
            'Financial data APIs',
            'Chart.js for visualizations',
            'MongoDB for user data',
            'Responsive design'
        ],
        demoUrl: 'https://youtu.be/Xr_YEtSqxVg'
    },
    'avise-financial': {
        title: 'Avise - Personal Financial Advisor',
        description: 'A personal finance tracking application designed to help manage finances and stay on track with financial goals. Features budgeting tools, expense tracking, and financial insights.',
        images: [
            { src: 'images/Avise/Avise_TN.png', alt: 'Financial dashboard' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/gS3JuWG0EMk',
        features: [
            'Personal budget management',
            'Expense tracking and categorization',
            'Financial goal setting',
            'Spending insights and analytics',
            'Bill reminder system',
            'Privacy-focused design'
        ],
        tech: [
            'React.js frontend',
            'Local storage for privacy',
            'Chart.js for visualizations',
            'Responsive design',
            'Progressive Web App features',
            'Offline functionality'
        ],
        demoUrl: 'https://youtu.be/gS3JuWG0EMk'
    },
    'gas-automated-system': {
        title: 'Automated Form Management System',
        description: 'A complete internal web app for managing corporate indemnity forms using Google Apps Script. The system automates form creation, tracking, and maintenance through a modern HTML/JS interface connected to Google Workspace APIs.',
        images: [
            { src: 'images/GAS_Automated_System/Automated_System_TN.png', alt: 'GAS Automated System Dashboard' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/e39JZZxTby0',
        features: [
            'Dynamic form generation from templates',
            'Unique system codes and QR code generation',
            'Real-time search and permission management',
            'Bulk deletion with live UI feedback',
            'Company dashboard for activity tracking',
            'Admin tools for data cleanup and validation'
        ],
        tech: [
            'Google Apps Script (FormApp, SpreadsheetApp, DriveApp)',
            'HTML5, CSS3, JavaScript',
            'Google Fonts and Font Awesome',
            'qrcode.js for QR generation',
            'google.script.run for async communication',
            'Google Workspace APIs integration'
        ],
        demoUrl: 'https://youtu.be/e39JZZxTby0'
    },
    'sonova': {
        title: 'Sonova - Album Cover Marketplace',
        description: 'An e-commerce platform for premium custom album cover artwork. Artists and producers can browse, purchase, and license digital album covers with instant delivery and commercial licensing included.',
        images: [
            { src: 'images/Sonova/Sonova_TN.png', alt: 'Sonova Album Cover Marketplace' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/4HQdmC3X6iw',
        features: [
            'Browse and purchase digital album covers',
            'Instant delivery and commercial licensing',
            'Custom cover upload service',
            'Stripe payment integration',
            'Genre-based filtering and search',
            'Shopping cart with persistent storage'
        ],
        tech: [
            'React 18 with TypeScript',
            'Node.js + Express API',
            'Stripe Checkout Sessions',
            'SQLite database (better-sqlite3)',
            'Tailwind CSS styling',
            'Vite build tool'
        ],
        demoUrl: 'https://youtu.be/4HQdmC3X6iw'
    },
    '2d-platformer': {
        title: '2D Platformer & Minigames Collection',
        description: 'A collection of 5 engaging 2D minigames created during internship, showcasing diverse gameplay mechanics and polished game design. Features Hexa, Hide, Hoops, Lava, and Press - each with unique challenges.',
        images: [
            { src: 'images/TG_2D_Games/2D games TN.png', alt: '2D Games Collection' }
        ],
        youtubeVideos: [
            { src: 'https://www.youtube.com/embed/kOIFboFgMRo', title: 'Floor is Lava' },
            { src: 'https://www.youtube.com/embed/_ooyjsaHdWc', title: 'Hide & Seek' },
            { src: 'https://www.youtube.com/embed/kuRU6Wl-ELo', title: 'Hoops Madness' },
            { src: 'https://www.youtube.com/embed/TjFC6SZsOS0', title: 'Hexa Blast' },
            { src: 'https://www.youtube.com/embed/y249PYzTy3o', title: 'Press It' }
        ],
        features: [
            'Five unique minigame experiences',
            'Polished 2D graphics and animations',
            'Intuitive touch controls',
            'Progressive difficulty curves',
            'Score tracking and leaderboards',
            'Mobile-optimized gameplay'
        ],
        tech: [
            'Unity 2D game engine',
            'C# scripting',
            '2D physics and colliders',
            'Unity UI system',
            'Mobile input handling',
            'Particle effects'
        ],
        demoUrl: 'https://youtube.com/shorts/kOIFboFgMRo'
    },
    'among-us-runner': {
        title: 'Among Us Endless Runner',
        description: 'A fast-paced endless runner game built in Unreal Engine, inspired by Among Us and Temple Run. Features dynamic obstacle generation, power-ups, and increasing difficulty for addictive gameplay.',
        images: [
            { src: 'images/Unreal_AmongUs/AmongUs_TN.png', alt: 'Among Us Endless Runner' }
        ],
        youtubeVideo: 'https://www.youtube.com/embed/kE8gVUALtiI',
        features: [
            'Fast-paced endless runner mechanics',
            'Dynamic obstacle generation',
            'Power-up collection system',
            'Increasing difficulty progression',
            'Score and distance tracking',
            'Smooth character movement'
        ],
        tech: [
            'Unreal Engine 4/5',
            'C++ programming',
            'Blueprint visual scripting',
            '3D character animation',
            'Procedural level generation',
            'Unreal physics system'
        ],
        demoUrl: 'https://youtu.be/kE8gVUALtiI'
    }
}

function initProjectModal() {
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalMainImage = document.getElementById('modal-main-image');
    const modalThumbnails = document.getElementById('modal-thumbnails');
    const modalDemoLink = document.getElementById('modal-demo-link');
    const closeButtons = document.querySelectorAll('.modal-close');
    const detailButtons = document.querySelectorAll('.project-detail-btn');

    if (!modal) return;

    // Open modal
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-project');
            const project = projectData[projectId];
            
            if (project) {
                modalTitle.textContent = project.title;
                modalDescription.textContent = project.description;
                modalDemoLink.href = project.demoUrl;
                
                // Set main image or video
                const mediaContainer = document.getElementById('modal-media-container');
                
                // Handle YouTube video (single)
                if (project.youtubeVideo) {
                    mediaContainer.innerHTML = `
                        <iframe class="modal-video" src="${project.youtubeVideo}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        <div class="gallery-thumbnails" id="modal-thumbnails"></div>
                    `;
                }
                // Handle multiple YouTube videos (like minigames collection)
                else if (project.youtubeVideos && project.youtubeVideos.length > 0) {
                    const firstVideo = project.youtubeVideos[0];
                    let videoButtonsHTML = '<div class="video-selector" style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">';
                    project.youtubeVideos.forEach((videoData, index) => {
                        const activeClass = index === 0 ? ' active' : '';
                        videoButtonsHTML += `<button class="video-btn${activeClass}" data-video-src="${videoData.src}" style="font-family: var(--font-mono); font-size: 0.75rem; padding: 0.5rem 1rem; border: 2px solid var(--color-charcoal); border-radius: 4px; background: ${index === 0 ? 'var(--color-fuchsia)' : 'var(--color-white)'}; color: ${index === 0 ? 'var(--color-white)' : 'var(--color-charcoal)'}; cursor: pointer; transition: all 0.25s;">${videoData.title || `Video ${index + 1}`}</button>`;
                    });
                    videoButtonsHTML += '</div>';
                    
                    mediaContainer.innerHTML = `
                        <iframe class="modal-video" src="${firstVideo.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        ${videoButtonsHTML}
                        <div class="gallery-thumbnails" id="modal-thumbnails"></div>
                    `;
                    
                    // Add click handlers for video buttons
                    setTimeout(() => {
                        const videoBtns = mediaContainer.querySelectorAll('.video-btn');
                        const iframeElement = mediaContainer.querySelector('.modal-video');
                        videoBtns.forEach(btn => {
                            btn.addEventListener('click', () => {
                                const videoSrc = btn.getAttribute('data-video-src');
                                iframeElement.src = videoSrc;
                                
                                // Update button styles
                                videoBtns.forEach(b => {
                                    b.style.background = 'var(--color-white)';
                                    b.style.color = 'var(--color-charcoal)';
                                    b.style.borderColor = 'var(--color-charcoal)';
                                });
                                btn.style.background = 'var(--color-fuchsia)';
                                btn.style.color = 'var(--color-white)';
                                btn.style.borderColor = 'var(--color-fuchsia)';
                            });
                            
                            btn.addEventListener('mouseenter', () => {
                                if (btn.style.background !== 'rgb(255, 0, 255)') {
                                    btn.style.borderColor = 'var(--color-fuchsia)';
                                }
                            });
                            
                            btn.addEventListener('mouseleave', () => {
                                if (btn.style.background !== 'rgb(255, 0, 255)') {
                                    btn.style.borderColor = 'var(--color-charcoal)';
                                }
                            });
                        });
                    }, 100);
                }
                // Handle single local video
                else if (project.videoUrl) {
                    mediaContainer.innerHTML = `
                        <video class="modal-video" controls><source src="${project.videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>
                        <div class="gallery-thumbnails" id="modal-thumbnails"></div>
                    `;
                }
                // Handle images
                else {
                    mediaContainer.innerHTML = `
                        <img id="modal-main-image" src="${project.images[0].src}" alt="${project.images[0].alt}" class="modal-image">
                        <div class="gallery-thumbnails" id="modal-thumbnails"></div>
                    `;
                }
                
                // Create thumbnails (only if multiple images)
                modalThumbnails.innerHTML = '';
                if (project.images.length > 1) {
                    project.images.forEach((image, index) => {
                        const thumbnail = document.createElement('img');
                        thumbnail.src = image.src;
                        thumbnail.alt = image.alt;
                        thumbnail.className = 'gallery-thumbnail';
                        if (index === 0) thumbnail.classList.add('active');
                        
                        thumbnail.addEventListener('click', () => {
                            document.getElementById('modal-main-image').src = image.src;
                            document.getElementById('modal-main-image').alt = image.alt;
                            modalThumbnails.querySelectorAll('.gallery-thumbnail').forEach(t => t.classList.remove('active'));
                            thumbnail.classList.add('active');
                        });
                        
                        modalThumbnails.appendChild(thumbnail);
                    });
                }
                
                // Add features and tech sections
                const modalInfo = document.querySelector('.modal-info');
                const existingFeatures = modalInfo.querySelector('.modal-features');
                const existingTech = modalInfo.querySelector('.modal-tech');
                
                if (existingFeatures) existingFeatures.remove();
                if (existingTech) existingTech.remove();
                
                // Features section
                const featuresSection = document.createElement('div');
                featuresSection.className = 'modal-features';
                featuresSection.innerHTML = `
                    <h4>// KEY_FEATURES</h4>
                    <ul>
                        ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                `;
                modalInfo.appendChild(featuresSection);
                
                // Tech section
                const techSection = document.createElement('div');
                techSection.className = 'modal-tech';
                techSection.innerHTML = `
                    <h4>// TECH_STACK</h4>
                    <ul>
                        ${project.tech.map(tech => `<li>${tech}</li>`).join('')}
                    </ul>
                `;
                modalInfo.appendChild(techSection);
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// Initialize modal system
initProjectModal();

// ========================================
// CONSOLE EASTER EGG
// ========================================
console.log('%c> SYSTEM INITIALIZED', 'color: #FF00FF; font-family: monospace; font-size: 16px; font-weight: bold;');
console.log('%c> Welcome to Isaac.dev', 'color: #FF00FF; font-family: monospace; font-size: 12px;');
console.log('%c> Built with precision and passion', 'color: #222222; font-family: monospace; font-size: 12px;');
console.log('%c> Looking for developers? Let\'s talk.', 'color: #FF00FF; font-family: monospace; font-size: 12px;');

// ========================================
// PERFORMANCE MONITORING
// ========================================
if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`%c> Page Load Time: ${loadTime}ms`, 'color: #FF00FF; font-family: monospace;');
        }, 0);
    });
}

// ========================================
// PREVENT FLASH OF UNSTYLED CONTENT
// ========================================
document.documentElement.classList.add('js-enabled');

// ========================================
// EXPORT FOR MODULE USAGE (if needed)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTerminalLoader,
        initBannerSlider,
        initProjectFilter,
        createParticleBackground
    };
}

