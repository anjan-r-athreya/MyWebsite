// Floating Background Images
const floatingBgs = document.querySelectorAll('.floating-bg');
const floatImages = [
    'floats/3.png',
    'floats/aws.JPG',
    'floats/DSC04731.JPG',
    'floats/IMG_3914.JPG',
    'floats/IMG_3944.JPG',
    'floats/IMG_4136.JPG',
    'floats/IMG_4888.JPG',
    'floats/IMG_6546.JPG'
];

function createFloatingImage(container) {
    const img = document.createElement('img');
    img.classList.add('floating-img');

    // Random image from array
    img.src = floatImages[Math.floor(Math.random() * floatImages.length)];

    // Random size between 80px and 180px (bigger)
    const size = Math.random() * 100 + 80;
    img.style.width = size + 'px';
    img.style.height = size + 'px';

    // Random horizontal position
    img.style.left = Math.random() * 90 + '%';

    // Random animation duration between 20s and 40s
    const duration = Math.random() * 20 + 20;
    img.style.animationDuration = duration + 's';

    // Random delay so they don't all start together
    img.style.animationDelay = Math.random() * 15 + 's';

    // Random opacity between 0.2 and 0.35 (more opaque)
    img.style.opacity = Math.random() * 0.15 + 0.2;

    container.appendChild(img);

    // Remove and recreate after animation completes
    img.addEventListener('animationend', () => {
        img.remove();
        createFloatingImage(container);
    });
}

// Create initial floating images for each container
floatingBgs.forEach(container => {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => createFloatingImage(container), i * 2500);
    }
});

// Custom Cursor
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

if (cursor && cursorFollower) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
    });

    // Hover effect on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .btn, .skill-tag, .exp-card, .project-card-new, .carousel-nav, .carousel-dot');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorFollower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorFollower.classList.remove('hover');
        });
    });

    // Click effect
    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
        cursorFollower.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
        cursorFollower.classList.remove('clicking');
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorFollower.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        cursorFollower.style.opacity = '1';
    });
}

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile nav when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.9)';
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe timeline items
document.querySelectorAll('.timeline-item').forEach(item => {
    observer.observe(item);
});

// Observe skill tags for staggered fade-in animation
const skillTagObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const tags = entry.target.querySelectorAll('.skill-tag');
            tags.forEach((tag, index) => {
                tag.style.opacity = '0';
                tag.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    tag.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    tag.style.opacity = '1';
                    tag.style.transform = 'translateY(0)';
                }, index * 50);
            });
            skillTagObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

const skillsSection = document.querySelector('.skills-section');
if (skillsSection) {
    skillTagObserver.observe(skillsSection);
}

// Observe other sections for fade-in
document.querySelectorAll('.edu-card, .project-card-new, .cert-card, .award-item').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cardObserver.observe(card);
});

// Typing effect for hero (optional enhancement)
const heroGreeting = document.querySelector('.hero-greeting');
if (heroGreeting) {
    const text = heroGreeting.textContent;
    heroGreeting.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            heroGreeting.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    setTimeout(typeWriter, 500);
}

// Active nav link based on scroll position
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});

// Add active style to nav links
const style = document.createElement('style');
style.textContent = `
    .nav-links a.active {
        color: #818cf8;
    }
`;
document.head.appendChild(style);

// Photo Carousel
const carousel = document.querySelector('.carousel');
if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    let currentIndex = 0;
    const totalSlides = slides.length;

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;

        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToSlide(currentIndex + 1);
            } else {
                goToSlide(currentIndex - 1);
            }
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });
}

// Console easter egg
console.log('%c Welcome to Anjan Athreya\'s Portfolio! ', 'background: linear-gradient(135deg, #6366f1, #0ea5e9); color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('%c Interested in collaborating? Reach out at anjan.r.athreya@gmail.com ', 'color: #6366f1; font-size: 12px;');
