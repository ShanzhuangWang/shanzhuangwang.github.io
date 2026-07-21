/* ============================================
   Panda Homepage — Main JS
   Navigation, scroll reveal, mobile menu
   ============================================ */
(function () {
  'use strict';

  // --- Mobile menu toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      this.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        mobileToggle.classList.remove('active');
      });
    });
  }

  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // --- Active nav link highlighting on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function highlightNav() {
    let current = '';
    const scrollY = window.scrollY + 120;
    sections.forEach(function (section) {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(function (link) {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  // Only run scroll-spy on index page (sections exist)
  if (sections.length > 0) {
    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();
  }

  // --- Header shadow on scroll ---
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 20) {
          header.style.boxShadow = '0 4px 20px rgba(27, 67, 50, 0.08)';
        } else {
          header.style.boxShadow = 'none';
        }
      },
      { passive: true }
    );
  }
})();
