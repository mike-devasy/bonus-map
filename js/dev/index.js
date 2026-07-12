import "./common.min.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function headerScroll() {
  const header = document.querySelector("[data-fls-header-scroll]");
  const headerShow = header.hasAttribute("data-fls-header-scroll-show");
  const headerShowTimer = header.dataset.flsHeaderScrollShow ? header.dataset.flsHeaderScrollShow : 500;
  const startPoint = header.dataset.flsHeaderScroll ? header.dataset.flsHeaderScroll : 1;
  let scrollDirection = 0;
  let timer;
  document.addEventListener("scroll", function(e) {
    const scrollTop = window.scrollY;
    clearTimeout(timer);
    if (scrollTop >= startPoint) {
      !header.classList.contains("--header-scroll") ? header.classList.add("--header-scroll") : null;
      if (headerShow) {
        if (scrollTop > scrollDirection) {
          header.classList.contains("--header-show") ? header.classList.remove("--header-show") : null;
        } else {
          !header.classList.contains("--header-show") ? header.classList.add("--header-show") : null;
        }
        timer = setTimeout(() => {
          !header.classList.contains("--header-show") ? header.classList.add("--header-show") : null;
        }, headerShowTimer);
      }
    } else {
      header.classList.contains("--header-scroll") ? header.classList.remove("--header-scroll") : null;
      if (headerShow) {
        header.classList.contains("--header-show") ? header.classList.remove("--header-show") : null;
      }
    }
    scrollDirection = scrollTop <= 0 ? 0 : scrollTop;
  });
}
document.querySelector("[data-fls-header-scroll]") ? window.addEventListener("load", headerScroll) : null;
class DynamicAdapt {
  constructor() {
    this.type = "max";
    this.init();
  }
  init() {
    this.objects = [];
    this.daClassname = "--dynamic";
    this.nodes = [...document.querySelectorAll("[data-fls-dynamic]")];
    this.nodes.forEach((node) => {
      const data = node.dataset.flsDynamic.trim();
      const dataArray = data.split(`,`);
      const object = {};
      object.element = node;
      object.parent = node.parentNode;
      object.destinationParent = dataArray[3] ? node.closest(dataArray[3].trim()) || document : document;
      dataArray[3] ? dataArray[3].trim() : null;
      const objectSelector = dataArray[0] ? dataArray[0].trim() : null;
      if (objectSelector) {
        const foundDestination = object.destinationParent.querySelector(objectSelector);
        if (foundDestination) {
          object.destination = foundDestination;
        }
      }
      object.breakpoint = dataArray[1] ? dataArray[1].trim() : `767.98`;
      object.place = dataArray[2] ? dataArray[2].trim() : `last`;
      object.index = this.indexInParent(object.parent, object.element);
      this.objects.push(object);
    });
    this.arraySort(this.objects);
    this.mediaQueries = this.objects.map(({ breakpoint }) => `(${this.type}-width: ${breakpoint / 16}em),${breakpoint}`).filter((item, index, self) => self.indexOf(item) === index);
    this.mediaQueries.forEach((media) => {
      const mediaSplit = media.split(",");
      const matchMedia = window.matchMedia(mediaSplit[0]);
      const mediaBreakpoint = mediaSplit[1];
      const objectsFilter = this.objects.filter(({ breakpoint }) => breakpoint === mediaBreakpoint);
      matchMedia.addEventListener("change", () => {
        this.mediaHandler(matchMedia, objectsFilter);
      });
      this.mediaHandler(matchMedia, objectsFilter);
    });
  }
  mediaHandler(matchMedia, objects) {
    if (matchMedia.matches) {
      objects.forEach((object) => {
        if (object.destination) {
          this.moveTo(object.place, object.element, object.destination);
        }
      });
    } else {
      objects.forEach(({ parent, element, index }) => {
        if (element.classList.contains(this.daClassname)) {
          this.moveBack(parent, element, index);
        }
      });
    }
  }
  moveTo(place, element, destination) {
    element.classList.add(this.daClassname);
    const index = place === "last" || place === "first" ? place : parseInt(place, 10);
    if (index === "last" || index >= destination.children.length) {
      destination.append(element);
    } else if (index === "first") {
      destination.prepend(element);
    } else {
      destination.children[index].before(element);
    }
  }
  moveBack(parent, element, index) {
    element.classList.remove(this.daClassname);
    if (parent.children[index] !== void 0) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }
  indexInParent(parent, element) {
    return [...parent.children].indexOf(element);
  }
  arraySort(arr) {
    if (this.type === "min") {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === "first" || b.place === "last") {
            return -1;
          }
          if (a.place === "last" || b.place === "first") {
            return 1;
          }
          return 0;
        }
        return a.breakpoint - b.breakpoint;
      });
    } else {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === "first" || b.place === "last") {
            return 1;
          }
          if (a.place === "last" || b.place === "first") {
            return -1;
          }
          return 0;
        }
        return b.breakpoint - a.breakpoint;
      });
      return;
    }
  }
}
if (document.querySelector("[data-fls-dynamic]")) {
  window.addEventListener("load", () => window.flsDynamic = new DynamicAdapt());
}
const __vite_glob_0_0 = "" + new URL("../assets/img/hero/deposit-numbers/01.svg", import.meta.url).href;
const __vite_glob_0_1 = "" + new URL("../assets/img/hero/deposit-numbers/02.svg", import.meta.url).href;
const __vite_glob_0_2 = "" + new URL("../assets/img/hero/deposit-numbers/03.svg", import.meta.url).href;
const __vite_glob_0_3 = "" + new URL("../assets/img/hero/deposit-numbers/04.svg", import.meta.url).href;
const __vite_glob_0_4 = "" + new URL("../assets/img/hero/deposit-numbers/05.svg", import.meta.url).href;
const __vite_glob_0_5 = "" + new URL("../assets/img/hero/deposit-numbers/06.svg", import.meta.url).href;
const __vite_glob_0_6 = "" + new URL("../assets/img/hero/deposit-numbers/07.svg", import.meta.url).href;
const __vite_glob_0_7 = "" + new URL("../assets/img/hero/deposit-numbers/08.svg", import.meta.url).href;
const __vite_glob_0_8 = "" + new URL("../assets/img/hero/deposit-numbers/09.svg", import.meta.url).href;
const __vite_glob_0_9 = "" + new URL("../assets/img/hero/deposit-numbers/10.svg", import.meta.url).href;
const API_BASE_URL = "https://cbaiendpnt.site/apg/players";
const AUTH_TOKEN = "cba_qiOzuJ4_BXUNQh4v_jpp4JPSFBudVgIgruA51rJla-M";
const MAX_DEPOSITS = 10;
const CARD_FLIP_DELAY = 4e3;
const MAP_VIEW_DURATION = 8e3;
const OFFER_VIEW_DURATION = 4e3;
const AUTO_FLIP_CLASS = "is-auto-flip";
const bonusCards = [...document.querySelectorAll("[data-flip-card]")];
const mapRoutes = document.querySelectorAll("[data-map-route]");
const mapPoints = document.querySelectorAll("[data-map-point]");
const currentBonusCard = document.querySelector("[data-current-bonus-card]");
const heroMapWrap = document.querySelector("[data-bonus-map]");
const heroOffer = document.querySelector("[data-hero-offer]");
const heroCtaWrapper = document.querySelector(".hero__button-wrapper");
const mobileCardsMedia = window.matchMedia("(max-width: 780px)");
const mobileCtaPositionMedia = window.matchMedia("(max-width: 480px)");
const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const ctaReleaseTarget = document.querySelector(".bonus-steps__link");
const currentBonusElements = {
  step: document.querySelector("[data-bonus-card-step]"),
  number: document.querySelector("[data-bonus-card-number]"),
  bonus: document.querySelector("[data-bonus-card-bonus]"),
  spins: document.querySelector("[data-bonus-card-spins]"),
  deposit: document.querySelector("[data-bonus-card-deposit]")
};
const BONUS_DATA = [
  { bonus: "150%", spins: "+54 FS", deposit: "5000 ARS" },
  { bonus: "30%", spins: "+24 FS", deposit: "5000 ARS" },
  { bonus: "40%", spins: "+34 FS", deposit: "5000 ARS" },
  { bonus: "50%", spins: "+44 FS", deposit: "5000 ARS" },
  { bonus: "60%", spins: "+54 FS", deposit: "5000 ARS" },
  { bonus: "70%", spins: "+64 FS", deposit: "5000 ARS" },
  { bonus: "80%", spins: "+74 FS", deposit: "5000 ARS" },
  { bonus: "100%", spins: "+84 FS", deposit: "5000 ARS" },
  { bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" },
  { bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" }
];
let activeFlipCard = null;
let activeFlipTimer = null;
let isAutoFlipPaused = false;
const clampDepositCount = (value) => {
  const count = Number.parseInt(value, 10);
  return Number.isNaN(count) || count < 0 ? 0 : Math.min(count, MAX_DEPOSITS);
};
const getActiveStep = (completedCount) => Math.min(completedCount + 1, MAX_DEPOSITS);
const getNumberImage = (step) => {
  const number = String(step).padStart(2, "0");
  return new URL((/* @__PURE__ */ Object.assign({ "../../../assets/img/hero/deposit-numbers/01.svg": __vite_glob_0_0, "../../../assets/img/hero/deposit-numbers/02.svg": __vite_glob_0_1, "../../../assets/img/hero/deposit-numbers/03.svg": __vite_glob_0_2, "../../../assets/img/hero/deposit-numbers/04.svg": __vite_glob_0_3, "../../../assets/img/hero/deposit-numbers/05.svg": __vite_glob_0_4, "../../../assets/img/hero/deposit-numbers/06.svg": __vite_glob_0_5, "../../../assets/img/hero/deposit-numbers/07.svg": __vite_glob_0_6, "../../../assets/img/hero/deposit-numbers/08.svg": __vite_glob_0_7, "../../../assets/img/hero/deposit-numbers/09.svg": __vite_glob_0_8, "../../../assets/img/hero/deposit-numbers/10.svg": __vite_glob_0_9 }))[`../../../assets/img/hero/deposit-numbers/${number}.svg`], import.meta.url).href;
};
const parseDepositCountResponse = (text) => {
  const value = text.trim();
  if (!value) return 0;
  const plainNumber = Number.parseInt(value, 10);
  if (!Number.isNaN(plainNumber)) return clampDepositCount(plainNumber);
  try {
    return clampDepositCount(JSON.parse(value)?.depositCount90days);
  } catch (error) {
    console.error("Invalid deposit count response:", error);
    return 0;
  }
};
const getQueryDepositCount = () => {
  const params = new URLSearchParams(window.location.search);
  const overrideName = [
    "bonus_step",
    "map_step",
    "step",
    "progress",
    "deposits"
  ].find((name) => params.has(name));
  return overrideName ? clampDepositCount(params.get(overrideName)) : null;
};
const getPlayerId = () => {
  const playerId = new URLSearchParams(window.location.search).get("player_id");
  return playerId && /^\d+$/.test(playerId) ? playerId : null;
};
const fetchDepositCount = async (playerId) => {
  const response = await fetch(
    `${API_BASE_URL}/${playerId}/deposit-count-90days`,
    {
      headers: {
        Accept: "text/plain, application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    }
  );
  if (!response.ok) throw new Error(`Deposit API error: ${response.status}`);
  return parseDepositCountResponse(await response.text());
};
const updateCurrentBonusCard = (step) => {
  const data = BONUS_DATA[step - 1];
  if (!currentBonusCard || !data) return;
  currentBonusCard.dataset.currentStep = String(step);
  currentBonusElements.step?.setAttribute("aria-label", String(step));
  if (currentBonusElements.number)
    currentBonusElements.number.src = getNumberImage(step);
  if (currentBonusElements.bonus)
    currentBonusElements.bonus.textContent = data.bonus;
  if (currentBonusElements.spins)
    currentBonusElements.spins.textContent = data.spins;
  if (currentBonusElements.deposit)
    currentBonusElements.deposit.textContent = data.deposit;
};
const updateMap = (completedCount) => {
  const currentStep = completedCount < MAX_DEPOSITS ? completedCount + 1 : null;
  const nextStep = completedCount < MAX_DEPOSITS - 1 ? completedCount + 2 : null;
  mapRoutes.forEach((route) => {
    route.classList.toggle(
      "is-done",
      Number(route.dataset.mapRoute) <= completedCount
    );
  });
  mapPoints.forEach((point) => {
    const step = Number(point.dataset.mapPoint);
    const isDone = step <= completedCount;
    const isCurrent = step === currentStep;
    const isNext = step === nextStep;
    point.classList.toggle("is-done", isDone);
    point.classList.toggle("is-current", isCurrent);
    point.classList.toggle("is-next", isNext);
    point.classList.toggle("is-locked", !isDone && !isCurrent && !isNext);
    point.classList.toggle(
      "is-final-lock",
      completedCount === 8 && step === MAX_DEPOSITS
    );
  });
};
const clearAutoFlipTimer = () => {
  window.clearTimeout(activeFlipTimer);
  activeFlipTimer = null;
};
const stopAutoFlip = () => {
  clearAutoFlipTimer();
  activeFlipCard = null;
  isAutoFlipPaused = false;
  bonusCards.forEach(
    (card) => card.classList.remove(AUTO_FLIP_CLASS, "is-flipped")
  );
};
const isAutoFlipCardValid = () => activeFlipCard?.classList.contains("is-active") && !activeFlipCard.classList.contains("is-done") && !activeFlipCard.classList.contains("is-locked");
const scheduleAutoFlip = () => {
  if (!isAutoFlipCardValid() || activeFlipTimer || isAutoFlipPaused) return;
  activeFlipTimer = window.setTimeout(() => {
    activeFlipTimer = null;
    if (!isAutoFlipCardValid()) {
      stopAutoFlip();
      return;
    }
    activeFlipCard.classList.toggle("is-flipped");
    scheduleAutoFlip();
  }, CARD_FLIP_DELAY);
};
const startAutoFlip = (card) => {
  if (!card || card.classList.contains("is-done") || card.classList.contains("is-locked"))
    return;
  activeFlipCard = card;
  activeFlipCard.classList.add(AUTO_FLIP_CLASS);
  scheduleAutoFlip();
};
const updateStepCards = (completedCount) => {
  const activeStep = getActiveStep(completedCount);
  bonusCards.forEach((card) => {
    const step = Number(card.dataset.depositCard);
    card.classList.remove("is-flipped");
    card.classList.toggle("is-done", step <= completedCount);
    card.classList.toggle("is-active", step === activeStep);
    card.classList.toggle("is-locked", step > activeStep);
  });
};
const scrollActiveCardIntoView = () => {
  if (!mobileCardsMedia.matches) return;
  const grid = document.querySelector(".bonus-steps__grid");
  const activeCard = grid?.querySelector("[data-flip-card].is-active");
  if (!grid || !activeCard) return;
  requestAnimationFrame(() => {
    const targetLeft = activeCard.offsetLeft - (grid.clientWidth - activeCard.offsetWidth) / 2;
    grid.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reducedMotionMedia.matches ? "auto" : "smooth"
    });
  });
};
const setBonusProgress = (value) => {
  const completedCount = clampDepositCount(value);
  stopAutoFlip();
  updateMap(completedCount);
  updateCurrentBonusCard(getActiveStep(completedCount));
  updateStepCards(completedCount);
  scrollActiveCardIntoView();
  if (completedCount < MAX_DEPOSITS) startAutoFlip(bonusCards[completedCount]);
  return completedCount;
};
const initCardEvents = () => {
  const pause = (card) => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = true;
    clearAutoFlipTimer();
  };
  const resume = (card) => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = false;
    scheduleAutoFlip();
  };
  bonusCards.forEach((card) => {
    card.addEventListener("mouseenter", () => pause(card));
    card.addEventListener("mouseleave", () => resume(card));
    card.addEventListener("focusin", () => pause(card));
    card.addEventListener("focusout", () => resume(card));
    card.addEventListener("click", () => {
      if (!card.classList.contains(AUTO_FLIP_CLASS) && !card.classList.contains("is-locked")) {
        card.classList.toggle("is-flipped");
      }
    });
  });
};
const initCtaRelease = () => {
  if (!ctaReleaseTarget || !("IntersectionObserver" in window)) return;
  let isTargetVisible = false;
  const update = () => {
    document.documentElement.classList.toggle(
      "is-cta-released",
      isTargetVisible
    );
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      isTargetVisible = entry.isIntersecting;
      update();
    },
    { rootMargin: "0px", threshold: 0.01 }
  );
  observer.observe(ctaReleaseTarget);
};
const initMobileCtaPosition = () => {
  if (!heroMapWrap || !heroCtaWrapper) return;
  const gap = 16;
  const updatePosition = () => {
    if (!mobileCtaPositionMedia.matches) return;
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const desiredTop = heroMapWrap.getBoundingClientRect().bottom + gap;
    const maxTop = viewportBottom - heroCtaWrapper.offsetHeight - gap;
    const targetTop = Math.max(viewportTop + gap, Math.min(desiredTop, maxTop));
    heroCtaWrapper.style.setProperty(
      "--hero-cta-initial-top",
      `${targetTop}px`
    );
  };
  const updatePositionAtPageTop = () => {
    if (window.scrollY <= 1) updatePosition();
  };
  window.addEventListener("load", updatePosition, { once: true });
  window.addEventListener("orientationchange", updatePosition);
  window.visualViewport?.addEventListener("resize", updatePositionAtPageTop);
  if ("ResizeObserver" in window) {
    const mapResizeObserver = new ResizeObserver(updatePositionAtPageTop);
    mapResizeObserver.observe(heroMapWrap);
  }
};
const initHeroViewRotation = () => {
  if (!heroMapWrap || !heroOffer) return;
  const showOffer = (isVisible) => {
    heroMapWrap.classList.toggle("is-offer-visible", isVisible);
    heroOffer.setAttribute("aria-hidden", String(!isVisible));
    window.setTimeout(
      () => showOffer(!isVisible),
      isVisible ? OFFER_VIEW_DURATION : MAP_VIEW_DURATION
    );
  };
  showOffer(false);
};
const initBonusMap = async () => {
  document.documentElement.classList.add("is-bonus-loading");
  try {
    const manualCount = getQueryDepositCount();
    const playerId = getPlayerId();
    const depositCount = manualCount ?? (playerId ? await fetchDepositCount(playerId) : 0);
    setBonusProgress(depositCount);
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("is-bonus-error");
    setBonusProgress(0);
  } finally {
    document.documentElement.classList.remove("is-bonus-loading");
  }
};
window.setBonusMapStep = setBonusProgress;
initCardEvents();
initCtaRelease();
initMobileCtaPosition();
initHeroViewRotation();
initBonusMap();
