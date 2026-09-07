/**
* Template Name: Impact
* Updated: May 30 2023 with Bootstrap v5.3.0
* Template URL: https://bootstrapmade.com/impact-bootstrap-business-website-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
document.addEventListener('DOMContentLoaded', () => {
  "use strict";

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Sticky Header on Scroll
   */
  const selectHeader = document.querySelector('#header');
  if (selectHeader) {
    let headerOffset = selectHeader.offsetTop;
    let nextElement = selectHeader.nextElementSibling;

    const headerFixed = () => {
      if ((headerOffset - window.scrollY) <= 0) {
        selectHeader.classList.add('sticked');
        if (nextElement) nextElement.classList.add('sticked-header-offset');
      } else {
        selectHeader.classList.remove('sticked');
        if (nextElement) nextElement.classList.remove('sticked-header-offset');
      }
    }
    window.addEventListener('load', headerFixed);
    document.addEventListener('scroll', headerFixed);
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = document.querySelectorAll('#navbar a');

  function navbarlinksActive() {
    navbarlinks.forEach(navbarlink => {

      if (!navbarlink.hash) return;

      let section = document.querySelector(navbarlink.hash);
      if (!section) return;

      let position = window.scrollY + 200;

      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active');
      } else {
        navbarlink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navbarlinksActive);
  document.addEventListener('scroll', navbarlinksActive);

  /**
   * Mobile nav toggle
   */
  const mobileNavShow = document.querySelector('.mobile-nav-show');
  const mobileNavHide = document.querySelector('.mobile-nav-hide');

  document.querySelectorAll('.mobile-nav-toggle').forEach(el => {
    el.addEventListener('click', function(event) {
      event.preventDefault();
      mobileNavToogle();
    })
  });

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavShow.classList.toggle('d-none');
    mobileNavHide.classList.toggle('d-none');
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navbar a').forEach(navbarlink => {

    if (!navbarlink.hash) return;

    let section = document.querySelector(navbarlink.hash);
    if (!section) return;

    navbarlink.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  const navDropdowns = document.querySelectorAll('.navbar .dropdown > a');

  navDropdowns.forEach(el => {
    el.addEventListener('click', function(event) {
      if (document.querySelector('.mobile-nav-active')) {
        event.preventDefault();
        this.classList.toggle('active');
        this.nextElementSibling.classList.toggle('dropdown-active');

        let dropDownIndicator = this.querySelector('.dropdown-indicator');
        dropDownIndicator.classList.toggle('bi-chevron-up');
        dropDownIndicator.classList.toggle('bi-chevron-down');
      }
    })
  });

  /**
   * Initiate glightbox (guard against missing elements on cross-pages)
   */
  if (document.querySelector('.glightbox')) {
    const glightbox = GLightbox({
      selector: '.glightbox'
    });
  }

  /**
   * Scroll top button
   */
  const scrollTop = document.querySelector('.scroll-top');
  if (scrollTop) {
    const togglescrollTop = function() {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
    window.addEventListener('load', togglescrollTop);
    document.addEventListener('scroll', togglescrollTop);
    scrollTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Initiate Pure Counter
   */
  if (typeof PureCounter !== 'undefined') {
    new PureCounter();
  }

  /**
   * Clients Slider (guard: only init if element exists)
   */
  const clientsSlider = document.querySelector('.clients-slider');
  if (clientsSlider) {
    new Swiper('.clients-slider', {
      speed: 400,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      slidesPerView: 'auto',
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      },
      breakpoints: {
        320: {
          slidesPerView: 2,
          spaceBetween: 40
        },
        480: {
          slidesPerView: 3,
          spaceBetween: 60
        },
        640: {
          slidesPerView: 4,
          spaceBetween: 80
        },
        992: {
          slidesPerView: 6,
          spaceBetween: 120
        }
      }
    });
  }

  /**
   * Contact form — Web3Forms submission
   */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const formMessage = document.getElementById('form-message');
    const submitBtn = document.getElementById('submitBtn');
    const submitIcon = submitBtn ? submitBtn.querySelector('i') : null;
    let submitting = false;

    const setMessage = (text, type) => {
      if (!formMessage) return;
      formMessage.innerHTML = '';
      const cls = type === 'success' ? 'success' : 'error';
      formMessage.className = 'form-message ' + cls;
      const p = document.createElement('p');
      p.textContent = text;
      formMessage.appendChild(p);
    };

    const clearMessage = () => {
      if (!formMessage) return;
      formMessage.innerHTML = '';
      formMessage.className = '';
    };

    const setSubmitting = (state) => {
      submitting = state;
      if (!submitBtn) return;
      if (state) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending... <i class="bi bi-hourglass-split"></i>';
        if (submitIcon) submitIcon.className = 'bi bi-hourglass-split';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Inquiry <i class="bi bi-send"></i>';
        if (submitIcon) submitIcon.className = 'bi bi-send';
      }
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;

      // Use browser-native validation first.
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      clearMessage();
      setSubmitting(true);

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new FormData(contactForm)
        });

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('Contact form: failed to parse Web3Forms response.', parseError);
          setMessage('Something went wrong while submitting your inquiry. Please try again.', 'error');
          setSubmitting(false);
          return;
        }

        if (result.success) {
          setMessage(
            'Thank you! Your inquiry has been submitted successfully. We will get back to you shortly.',
            'success'
          );
          contactForm.reset();
          // Restore the default placeholder option after reset.
          const destination = document.getElementById('destination');
          const service = document.getElementById('service');
          if (destination) destination.selectedIndex = 0;
          if (service) service.selectedIndex = 0;
        } else {
          console.error('Contact form: Web3Forms reported an error.', result);
          setMessage(
            'Something went wrong while submitting your inquiry. Please try again.',
            'error'
          );
        }
      } catch (error) {
        console.error('Contact form: network error.', error);
        setMessage(
          'Something went wrong while submitting your inquiry. Please try again.',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    });
  }

  /**
   * Init swiper slider with 1 slide at once in desktop view
   */
  const slides1 = document.querySelector('.slides-1');
  if (slides1) {
    new Swiper('.slides-1', {
      speed: 600,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      slidesPerView: 'auto',
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }
    });
  }

  /**
   * Init swiper slider with 3 slides at once in desktop view
   */
  const slides3 = document.querySelector('.slides-3');
  if (slides3) {
    new Swiper('.slides-3', {
      speed: 600,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      slidesPerView: 'auto',
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 40
        },

        768: {
          slidesPerView: 2,
        },

        1200: {
          slidesPerView: 3,
        }
      }
    });
  }

  /**
   * Porfolio isotope and filter
   */
  let portfolionIsotope = document.querySelector('.portfolio-isotope');

  if (portfolionIsotope) {

    let portfolioFilter = portfolionIsotope.getAttribute('data-portfolio-filter') ? portfolionIsotope.getAttribute('data-portfolio-filter') : '*';
    let portfolioLayout = portfolionIsotope.getAttribute('data-portfolio-layout') ? portfolionIsotope.getAttribute('data-portfolio-layout') : 'masonry';
    let portfolioSort = portfolionIsotope.getAttribute('data-portfolio-sort') ? portfolionIsotope.getAttribute('data-portfolio-sort') : 'original-order';

    window.addEventListener('load', () => {
      let portfolioIsotope = new Isotope(document.querySelector('.portfolio-container'), {
        itemSelector: '.portfolio-item',
        layoutMode: portfolioLayout,
        filter: portfolioFilter,
        sortBy: portfolioSort
      });

      let menuFilters = document.querySelectorAll('.portfolio-isotope .portfolio-flters li');
      menuFilters.forEach(function(el) {
        el.addEventListener('click', function() {
          document.querySelector('.portfolio-isotope .portfolio-flters .filter-active').classList.remove('filter-active');
          this.classList.add('filter-active');
          portfolioIsotope.arrange({
            filter: this.getAttribute('data-filter')
          });
          if (typeof aos_init === 'function') {
            aos_init();
          }
        }, false);
      });

    });

  }

  /**
   * Animation on scroll function and init
   */
  function aos_init() {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', () => {
    aos_init();
  });

});