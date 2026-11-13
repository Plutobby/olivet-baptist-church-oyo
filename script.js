const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Node &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", closeMenu);
  document.documentElement.classList.add("nav-enhanced");
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealSelectors = [
  ".next-steps-heading", ".step-card", ".welcome-intro", ".welcome-copy",
  ".gather-photo", ".gather-panel", ".about-copy", ".about-image-wrap",
  ".community-feature-image", ".community-feature-content", ".discover-heading",
  ".discover-card", ".ministries-heading", ".ministry-card", ".visit-content",
  ".visit-map", ".contact-strip > div", ".story-copy", ".story-photo",
  ".belief-inner", ".history-section > div", ".ministry-cta > *",
  ".section-heading-row", ".story-card", ".media-page-intro", ".giving-intro > div",
  ".giving-card",   ".treasure-intro > div", ".treasure-viewer",
  ".video-grid > figure", ".visit-welcome > div", ".other-gatherings > div",
  ".visit-faq-intro", ".faq-list > details", ".visit-contact-inner > div",
  ".visit-map-page", ".article-heading", ".article-hero-image", ".article-body"
];

let revealObserver;

function showMotionElements() {
  document.querySelectorAll(".motion-enter").forEach((element) => {
    element.classList.remove("motion-enter");
  });
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = undefined;
  }
}

function setupMotion() {
  showMotionElements();
  if (motionPreference.matches || !("IntersectionObserver" in window)) {
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("motion-enter");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });

  document.querySelectorAll(revealSelectors.join(", ")).forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight + 40) {
      revealObserver.observe(element);
    }
  });
}

motionPreference.addEventListener("change", setupMotion);
setupMotion();

const hero = document.querySelector(".hero");
const heroImages = hero ? Array.from(hero.querySelectorAll(".hero-image")) : [];
const heroSlideButtons = hero ? Array.from(hero.querySelectorAll(".hero-slide-button")) : [];
const heroCarouselToggle = hero?.querySelector(".hero-carousel-toggle");

if (hero && heroImages.length > 1 && heroSlideButtons.length === heroImages.length && heroCarouselToggle instanceof HTMLButtonElement) {
  let activeHeroSlide = 0;
  let heroTimer;
  let heroPaused = motionPreference.matches;

  function showHeroSlide(index) {
    activeHeroSlide = (index + heroImages.length) % heroImages.length;
    heroImages.forEach((image, imageIndex) => {
      const active = imageIndex === activeHeroSlide;
      image.classList.toggle("is-active", active);
      image.setAttribute("aria-hidden", String(!active));
    });
    heroSlideButtons.forEach((button, buttonIndex) => {
      button.setAttribute("aria-pressed", String(buttonIndex === activeHeroSlide));
    });
  }

  function stopHeroTimer() {
    window.clearInterval(heroTimer);
    heroTimer = undefined;
  }

  function startHeroTimer() {
    stopHeroTimer();
    const heroIsInteracting = hero.matches(":hover") || hero.contains(document.activeElement);
    if (!heroPaused && !heroIsInteracting && !document.hidden && !motionPreference.matches) {
      heroTimer = window.setInterval(() => showHeroSlide(activeHeroSlide + 1), 6000);
    }
  }

  heroSlideButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showHeroSlide(index);
      startHeroTimer();
    });
  });
  heroCarouselToggle.addEventListener("click", () => {
    heroPaused = !heroPaused;
    heroCarouselToggle.textContent = heroPaused ? "Play" : "Pause";
    heroCarouselToggle.setAttribute("aria-label", heroPaused ? "Resume photo rotation" : "Pause photo rotation");
    startHeroTimer();
  });
  hero.addEventListener("pointerenter", stopHeroTimer);
  hero.addEventListener("pointerleave", startHeroTimer);
  hero.addEventListener("focusin", stopHeroTimer);
  hero.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !hero.contains(event.relatedTarget)) startHeroTimer();
  });
  document.addEventListener("visibilitychange", startHeroTimer);
  motionPreference.addEventListener("change", () => {
    heroPaused = motionPreference.matches;
    heroCarouselToggle.textContent = heroPaused ? "Play" : "Pause";
    heroCarouselToggle.setAttribute("aria-label", heroPaused ? "Resume photo rotation" : "Pause photo rotation");
    startHeroTimer();
  });
  showHeroSlide(0);
  heroCarouselToggle.textContent = heroPaused ? "Play" : "Pause";
  heroCarouselToggle.setAttribute("aria-label", heroPaused ? "Resume photo rotation" : "Pause photo rotation");
  startHeroTimer();
}

const galleryGrid = document.querySelector(".gallery-grid");
const galleryScrollToggle = document.querySelector(".gallery-scroll-toggle");

if (galleryGrid && galleryScrollToggle instanceof HTMLButtonElement) {
  let galleryTimer;
  let galleryPaused = motionPreference.matches;
  let galleryInView = false;

  function stopGalleryTimer() {
    window.clearInterval(galleryTimer);
    galleryTimer = undefined;
  }

  function scrollGallery(direction = 1) {
    const firstItem = galleryGrid.querySelector("a");
    if (!firstItem) return;
    const styles = getComputedStyle(galleryGrid);
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const step = firstItem.getBoundingClientRect().width + gap;
    const maxScroll = galleryGrid.scrollWidth - galleryGrid.clientWidth;
    const nextPosition = galleryGrid.scrollLeft + step * direction;
    galleryGrid.scrollTo({
      left: direction > 0 && nextPosition >= maxScroll - 2 ? 0 : Math.max(0, nextPosition),
      behavior: motionPreference.matches ? "auto" : "smooth"
    });
  }

  function startGalleryTimer() {
    stopGalleryTimer();
    const galleryIsInteracting = galleryGrid.matches(":hover") || galleryGrid.contains(document.activeElement);
    if (!galleryPaused && !galleryIsInteracting && galleryInView && !document.hidden && !motionPreference.matches) {
      galleryTimer = window.setInterval(() => scrollGallery(), 4200);
    }
  }

  galleryScrollToggle.addEventListener("click", () => {
    galleryPaused = !galleryPaused;
    galleryScrollToggle.textContent = galleryPaused ? "Resume scrolling" : "Pause scrolling";
    galleryScrollToggle.setAttribute("aria-label", galleryPaused ? "Resume gallery scrolling" : "Pause gallery scrolling");
    startGalleryTimer();
  });
  galleryGrid.addEventListener("pointerenter", stopGalleryTimer);
  galleryGrid.addEventListener("pointerleave", startGalleryTimer);
  galleryGrid.addEventListener("focusin", stopGalleryTimer);
  galleryGrid.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !galleryGrid.contains(event.relatedTarget)) startGalleryTimer();
  });
  document.addEventListener("visibilitychange", startGalleryTimer);
  motionPreference.addEventListener("change", () => {
    galleryPaused = motionPreference.matches;
    galleryScrollToggle.textContent = galleryPaused ? "Resume scrolling" : "Pause scrolling";
    galleryScrollToggle.setAttribute("aria-label", galleryPaused ? "Resume gallery scrolling" : "Pause gallery scrolling");
    startGalleryTimer();
  });
  if ("IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver(([entry]) => {
      galleryInView = entry.isIntersecting;
      startGalleryTimer();
    });
    galleryObserver.observe(galleryGrid);
  } else {
    galleryInView = true;
    startGalleryTimer();
  }
}

const galleryViewer = document.querySelector(".gallery-viewer");
const galleryLinks = Array.from(document.querySelectorAll(".gallery-grid a"));

if (typeof HTMLDialogElement !== "undefined" && galleryViewer instanceof HTMLDialogElement && typeof galleryViewer.showModal === "function" && galleryLinks.length) {
  const viewerImage = galleryViewer.querySelector(".gallery-viewer-image");
  const viewerCaption = galleryViewer.querySelector(".gallery-viewer-caption");
  const viewerCount = galleryViewer.querySelector(".gallery-viewer-count");
  const closeButton = galleryViewer.querySelector(".gallery-close");
  const previousButton = galleryViewer.querySelector(".gallery-previous");
  const nextButton = galleryViewer.querySelector(".gallery-next");
  let currentPhoto = 0;
  let returnFocus;

  function showPhoto(index) {
    currentPhoto = (index + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[currentPhoto];
    const thumbnail = link.querySelector("img");
    viewerImage.src = link.href;
    viewerImage.alt = thumbnail.alt;
    viewerCaption.textContent = thumbnail.alt;
    viewerCount.textContent = `${currentPhoto + 1} / ${galleryLinks.length}`;
  }

  galleryLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnFocus = link;
      showPhoto(index);
      galleryViewer.showModal();
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", () => galleryViewer.close());
  previousButton.addEventListener("click", () => showPhoto(currentPhoto - 1));
  nextButton.addEventListener("click", () => showPhoto(currentPhoto + 1));
  galleryViewer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      galleryViewer.close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(currentPhoto - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(currentPhoto + 1);
    }
  });
  galleryViewer.addEventListener("close", () => {
    if (returnFocus) returnFocus.focus();
  });
}
