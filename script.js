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

// Console easter egg
console.log('%c Welcome to Anjan Athreya\'s Portfolio! ', 'background: linear-gradient(135deg, #6366f1, #0ea5e9); color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('%c Interested in collaborating? Reach out at anjan.r.athreya@gmail.com ', 'color: #6366f1; font-size: 12px;');
