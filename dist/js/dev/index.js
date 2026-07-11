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
const bonusCards = document.querySelectorAll("[data-flip-card]");
const mapRoutes = document.querySelectorAll("[data-map-route]");
const mapPoints = document.querySelectorAll("[data-map-point]");
const currentBonusCard = document.querySelector("[data-current-bonus-card]");
const currentBonusStep = document.querySelector("[data-bonus-card-step]");
const currentBonusNumber = document.querySelector("[data-bonus-card-number]");
const currentBonusValue = document.querySelector("[data-bonus-card-bonus]");
const currentBonusSpins = document.querySelector("[data-bonus-card-spins]");
const currentBonusDeposit = document.querySelector("[data-bonus-card-deposit]");
const mobileCardsMedia = window.matchMedia("(max-width: 780px)");
const mobileCtaMedia = window.matchMedia("(max-width: 480px)");
const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const ctaReleaseTarget = document.querySelector(".bonus-steps__link");
const FLIP_DELAY = 4e3;
const AUTO_FLIP_CLASS = "is-auto-flip";
let activeFlipInterval = null;
let activeFlipCard = null;
let isAutoFlipPaused = false;
const bonusNumberImages = Array.from({ length: MAX_DEPOSITS }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return new URL((/* @__PURE__ */ Object.assign({ "../../../assets/img/hero/deposit-numbers/01.svg": __vite_glob_0_0, "../../../assets/img/hero/deposit-numbers/02.svg": __vite_glob_0_1, "../../../assets/img/hero/deposit-numbers/03.svg": __vite_glob_0_2, "../../../assets/img/hero/deposit-numbers/04.svg": __vite_glob_0_3, "../../../assets/img/hero/deposit-numbers/05.svg": __vite_glob_0_4, "../../../assets/img/hero/deposit-numbers/06.svg": __vite_glob_0_5, "../../../assets/img/hero/deposit-numbers/07.svg": __vite_glob_0_6, "../../../assets/img/hero/deposit-numbers/08.svg": __vite_glob_0_7, "../../../assets/img/hero/deposit-numbers/09.svg": __vite_glob_0_8, "../../../assets/img/hero/deposit-numbers/10.svg": __vite_glob_0_9 }))[`../../../assets/img/hero/deposit-numbers/${number}.svg`], import.meta.url).href;
});
const BONUS_DATA = [
  { step: 1, bonus: "150%", spins: "+54 FS", deposit: "5000 ARS" },
  { step: 2, bonus: "30%", spins: "+24 FS", deposit: "5000 ARS" },
  { step: 3, bonus: "40%", spins: "+34 FS", deposit: "5000 ARS" },
  { step: 4, bonus: "50%", spins: "+44 FS", deposit: "5000 ARS" },
  { step: 5, bonus: "60%", spins: "+54 FS", deposit: "5000 ARS" },
  { step: 6, bonus: "70%", spins: "+64 FS", deposit: "5000 ARS" },
  { step: 7, bonus: "80%", spins: "+74 FS", deposit: "5000 ARS" },
  { step: 8, bonus: "100%", spins: "+84 FS", deposit: "5000 ARS" },
  { step: 9, bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" },
  { step: 10, bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" }
];
const clampDepositCount = (value) => {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number) || number < 0) return 0;
  return Math.min(number, MAX_DEPOSITS);
};
const getActiveStep = (completedCount) => Math.min(completedCount + 1, MAX_DEPOSITS);
const parseDepositCountResponse = (text) => {
  const trimmedText = text.trim();
  if (!trimmedText) return 0;
  const plainNumber = Number.parseInt(trimmedText, 10);
  if (!Number.isNaN(plainNumber)) {
    return clampDepositCount(plainNumber);
  }
  try {
    const data = JSON.parse(trimmedText);
    return clampDepositCount(data?.depositCount90days);
  } catch (error) {
    console.error("Invalid deposit count response:", error);
    return 0;
  }
};
const getPlayerIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("player_id");
  if (!playerId || !/^\d+$/.test(playerId)) return null;
  return playerId;
};
const getManualDepositCountFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const manualParamNames = ["bonus_step", "map_step", "step", "progress", "deposits"];
  const manualParamName = manualParamNames.find((name) => params.has(name));
  if (!manualParamName) return null;
  return clampDepositCount(params.get(manualParamName));
};
const fetchDepositCount = async (playerId) => {
  const response = await fetch(`${API_BASE_URL}/${playerId}/deposit-count-90days`, {
    method: "GET",
    headers: {
      Accept: "text/plain, application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });
  if (!response.ok) {
    throw new Error(`Deposit API error: ${response.status}`);
  }
  const text = await response.text();
  return parseDepositCountResponse(text);
};
const updateCurrentBonusCard = (activeStep) => {
  if (!currentBonusCard) return;
  const bonus = BONUS_DATA[activeStep - 1];
  if (!bonus) return;
  currentBonusCard.dataset.currentStep = String(bonus.step);
  if (currentBonusStep) currentBonusStep.setAttribute("aria-label", String(bonus.step));
  if (currentBonusNumber) currentBonusNumber.src = bonusNumberImages[bonus.step - 1];
  if (currentBonusValue) currentBonusValue.textContent = bonus.bonus;
  if (currentBonusSpins) currentBonusSpins.textContent = bonus.spins;
  if (currentBonusDeposit) currentBonusDeposit.textContent = bonus.deposit;
};
const updateMapRoutes = (completedCount) => {
  mapRoutes.forEach((route) => {
    const routeStep = Number.parseInt(route.dataset.mapRoute, 10);
    route.classList.toggle("is-done", routeStep <= completedCount);
  });
};
const updateMapPoints = (completedCount) => {
  const currentStep = completedCount < MAX_DEPOSITS ? completedCount + 1 : null;
  const nextStep = completedCount < MAX_DEPOSITS - 1 ? completedCount + 2 : null;
  mapPoints.forEach((point) => {
    const pointStep = Number.parseInt(point.dataset.mapPoint, 10);
    const isDone = pointStep <= completedCount;
    const isCurrent = pointStep === currentStep;
    const isNext = pointStep === nextStep;
    const isLocked = !isDone && !isCurrent && !isNext;
    point.classList.toggle("is-done", isDone);
    point.classList.toggle("is-checked", isDone);
    point.classList.toggle("is-current", isCurrent);
    point.classList.toggle("is-next", isNext);
    point.classList.toggle("is-locked", isLocked);
    point.classList.toggle("is-final-lock", completedCount === 8 && pointStep === MAX_DEPOSITS);
  });
};
const stopAutoFlip = () => {
  if (activeFlipInterval) {
    clearInterval(activeFlipInterval);
    activeFlipInterval = null;
  }
  activeFlipCard = null;
  isAutoFlipPaused = false;
  bonusCards.forEach((card) => {
    card.classList.remove(AUTO_FLIP_CLASS, "is-flipped");
  });
};
const clearAutoFlipTimer = () => {
  if (!activeFlipInterval) return;
  clearInterval(activeFlipInterval);
  activeFlipInterval = null;
};
const runAutoFlipTimer = () => {
  if (!activeFlipCard || activeFlipInterval || isAutoFlipPaused) return;
  activeFlipInterval = setInterval(() => {
    if (!activeFlipCard.classList.contains("is-active") || activeFlipCard.classList.contains("is-done") || activeFlipCard.classList.contains("is-locked")) {
      stopAutoFlip();
      return;
    }
    activeFlipCard.classList.toggle("is-flipped");
  }, FLIP_DELAY);
};
const startCardAutoFlip = (card) => {
  if (!card || card.classList.contains("is-done") || card.classList.contains("is-locked")) return;
  activeFlipCard = card;
  card.classList.add(AUTO_FLIP_CLASS);
  runAutoFlipTimer();
};
const updateStepCards = (completedCount) => {
  const activeStep = getActiveStep(completedCount);
  bonusCards.forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.depositCard, 10);
    const isDone = cardStep <= completedCount;
    const isActive = cardStep === activeStep;
    const isLocked = cardStep > activeStep;
    card.classList.remove("is-flipped");
    card.classList.toggle("is-done", isDone);
    card.classList.toggle("is-active", isActive);
    card.classList.toggle("is-locked", isLocked);
  });
};
const scrollActiveCardIntoView = () => {
  if (!mobileCardsMedia.matches) return;
  const activeCard = document.querySelector("[data-flip-card].is-active");
  if (!activeCard) return;
  requestAnimationFrame(() => {
    activeCard.scrollIntoView({
      behavior: reducedMotionMedia.matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center"
    });
  });
};
const setBonusProgress = (depositCount) => {
  const completedCount = clampDepositCount(depositCount);
  const activeStep = getActiveStep(completedCount);
  stopAutoFlip();
  updateMapRoutes(completedCount);
  updateMapPoints(completedCount);
  updateCurrentBonusCard(activeStep);
  updateStepCards(completedCount);
  scrollActiveCardIntoView();
  if (completedCount < MAX_DEPOSITS) {
    startCardAutoFlip(bonusCards[completedCount]);
  }
  return completedCount;
};
const initBonusMap = async () => {
  const playerId = getPlayerIdFromUrl();
  const manualDepositCount = getManualDepositCountFromUrl();
  document.documentElement.classList.add("is-bonus-loading");
  try {
    const depositCount = manualDepositCount ?? (playerId ? await fetchDepositCount(playerId) : 0);
    setBonusProgress(depositCount);
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("is-bonus-error");
    setBonusProgress(0);
  } finally {
    document.documentElement.classList.remove("is-bonus-loading");
  }
};
bonusCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = true;
    clearAutoFlipTimer();
  });
  card.addEventListener("mouseleave", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = false;
    runAutoFlipTimer();
  });
  card.addEventListener("focusin", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = true;
    clearAutoFlipTimer();
  });
  card.addEventListener("focusout", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return;
    isAutoFlipPaused = false;
    runAutoFlipTimer();
  });
  card.addEventListener("click", () => {
    if (card.classList.contains(AUTO_FLIP_CLASS)) return;
    if (card.classList.contains("is-locked")) return;
    card.classList.toggle("is-flipped");
  });
});
const initCtaRelease = () => {
  if (!ctaReleaseTarget || !("IntersectionObserver" in window)) return;
  let isReleaseTargetVisible = false;
  const updateCtaRelease = () => {
    document.documentElement.classList.toggle("is-cta-released", mobileCtaMedia.matches && isReleaseTargetVisible);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      isReleaseTargetVisible = entry.isIntersecting;
      updateCtaRelease();
    },
    {
      root: null,
      rootMargin: "0px 0px -35% 0px",
      threshold: 0.1
    }
  );
  observer.observe(ctaReleaseTarget);
  mobileCtaMedia.addEventListener("change", updateCtaRelease);
};
window.setBonusMapStep = (depositCount) => setBonusProgress(depositCount);
initCtaRelease();
initBonusMap();
