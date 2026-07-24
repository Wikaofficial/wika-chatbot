
const AGE_KEY = "wika-wow-age-confirmed";
const body = document.body;
const preloader = document.getElementById("preloader");
const gate = document.getElementById("gate");
const cinema = document.getElementById("cinema");
const header = document.getElementById("header");
const progress = document.getElementById("progress");
const heroImage = document.getElementById("heroImage");
const nav = document.getElementById("nav");
const menuButton = document.getElementById("menuButton");
const cursorGlow = document.getElementById("cursorGlow");

window.addEventListener("load", () => {
  setTimeout(() => preloader.classList.add("done"), 340);
});

function playCinema() {
  cinema.classList.remove("play");
  void cinema.offsetWidth;
  cinema.classList.add("play");
}

function unlockSite(withIntro = true) {
  localStorage.setItem(AGE_KEY, "yes");
  body.classList.remove("locked");
  gate.classList.add("hidden");
  if (withIntro) playCinema();
}

function lockSite() {
  body.classList.add("locked");
  gate.classList.remove("hidden");
}

if (localStorage.getItem(AGE_KEY) === "yes") {
  unlockSite(false);
}

document.getElementById("enterSite").addEventListener("click", () => unlockSite(true));
document.getElementById("leaveSite").addEventListener("click", () => {
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#090407;color:#fff2f6;text-align:center;font-family:system-ui">
      <div>
        <img src="assets/logo.svg" alt="" style="width:78px;margin:0 auto 22px">
        <h1 style="font-family:Georgia,serif;font-weight:400">Dostęp zakończony</h1>
        <p style="color:#c7aab3">Strona jest dostępna wyłącznie dla osób pełnoletnich.</p>
      </div>
    </main>`;
});

document.getElementById("resetAge").addEventListener("click", () => {
  localStorage.removeItem(AGE_KEY);
  lockSite();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

menuButton.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => nav.classList.remove("open")));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

function updateScrollEffects() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  header.classList.toggle("scrolled", y > 30);

  if (window.innerWidth > 680) {
    heroImage.style.transform = `scale(1.04) translateY(${Math.min(y * .065, 38)}px)`;
  }
}
window.addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();

window.addEventListener("mousemove", event => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
  cursorGlow.style.opacity = "1";
}, { passive: true });
document.addEventListener("mouseleave", () => cursorGlow.style.opacity = "0");

// 3D tilt cards
document.querySelectorAll(".tilt-card").forEach(card => {
  card.addEventListener("pointermove", event => {
    if (window.innerWidth < 681) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - .5) * 12;
    const rotateX = (.5 - y) * 10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

// Magnetic buttons
document.querySelectorAll(".magnetic").forEach(button => {
  button.addEventListener("pointermove", event => {
    if (window.innerWidth < 681) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * .08}px, ${y * .12}px) translateY(-2px)`;
  });
  button.addEventListener("pointerleave", () => button.style.transform = "");
});

// Gallery filters
const filters = document.querySelectorAll(".filter");
const galleryCards = [...document.querySelectorAll(".gallery-card")];

filters.forEach(button => {
  button.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    galleryCards.forEach(card => {
      card.classList.toggle("hidden", !(filter === "all" || card.dataset.category === filter));
    });
  });
});

// Normal lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxCategory = document.getElementById("lightboxCategory");
const lightboxDescription = document.getElementById("lightboxDescription");
let activeLightboxIndex = 0;
let openCards = [];

function getOpenCards() {
  return galleryCards.filter(card => card.dataset.locked === "false" && !card.classList.contains("hidden"));
}

function showLightbox(index) {
  openCards = getOpenCards();
  if (!openCards.length) return;
  activeLightboxIndex = (index + openCards.length) % openCards.length;
  const card = openCards[activeLightboxIndex];
  lightboxImage.src = card.dataset.full;
  lightboxImage.alt = card.dataset.title;
  lightboxTitle.textContent = card.dataset.title;
  lightboxCategory.textContent = card.dataset.label;
  lightboxDescription.textContent = card.dataset.description;
  lightbox.classList.add("open");
  body.classList.add("locked");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  if (gate.classList.contains("hidden")) body.classList.remove("locked");
}

document.querySelectorAll('.gallery-card[data-locked="false"]').forEach(card => {
  card.addEventListener("click", () => {
    openCards = getOpenCards();
    showLightbox(openCards.indexOf(card));
  });
});

document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightboxPrev").addEventListener("click", () => showLightbox(activeLightboxIndex - 1));
document.getElementById("lightboxNext").addEventListener("click", () => showLightbox(activeLightboxIndex + 1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });

// Locked previews: hold to reduce blur, quick tap to open the access modal.
const unlockModal = document.getElementById("unlockModal");
const lockedCards = document.querySelectorAll('.gallery-card[data-locked="true"]');

lockedCards.forEach(card => {
  let holdTimer = null;
  let holdActivated = false;
  let pointerDownAt = 0;

  const startHold = event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pointerDownAt = Date.now();
    holdActivated = false;

    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      holdActivated = true;
      card.classList.add("hold-preview");

      if (navigator.vibrate) {
        navigator.vibrate(22);
      }
    }, 180);
  };

  const endHold = () => {
    clearTimeout(holdTimer);

    if (holdActivated) {
      card.classList.remove("hold-preview");
      card.dataset.suppressClickUntil = String(Date.now() + 450);
    }
  };

  card.addEventListener("pointerdown", startHold);
  card.addEventListener("pointerup", endHold);
  card.addEventListener("pointercancel", endHold);
  card.addEventListener("pointerleave", endHold);

  card.addEventListener("contextmenu", event => {
    event.preventDefault();
  });

  card.addEventListener("click", event => {
    const suppressUntil = Number(card.dataset.suppressClickUntil || 0);

    if (Date.now() < suppressUntil || holdActivated || Date.now() - pointerDownAt >= 180) {
      event.preventDefault();
      return;
    }

    unlockModal.classList.add("open");
    body.classList.add("locked");
  });
});

function closeUnlock() {
  unlockModal.classList.remove("open");
  if (gate.classList.contains("hidden")) body.classList.remove("locked");
}
document.getElementById("unlockClose").addEventListener("click", closeUnlock);
unlockModal.addEventListener("click", event => { if (event.target === unlockModal) closeUnlock(); });


// FAQ
document.querySelectorAll(".faq-button").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    item.classList.toggle("open");
    answer.style.maxHeight = item.classList.contains("open") ? `${answer.scrollHeight}px` : "0";
  });
});

document.addEventListener("keydown", event => {
  if (lightbox.classList.contains("open")) {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showLightbox(activeLightboxIndex - 1);
    if (event.key === "ArrowRight") showLightbox(activeLightboxIndex + 1);
    return;
  }
  if (unlockModal.classList.contains("open") && event.key === "Escape") closeUnlock();
});

document.getElementById("year").textContent = new Date().getFullYear();
