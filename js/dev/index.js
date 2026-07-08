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
const MAX_DEPOSITS = 10;
const CURRENT_BONUS_STEP = 10;
const bonusCards = document.querySelectorAll("[data-flip-card]");
const bonusMap = document.querySelector("[data-bonus-map]");
const bonusMapRoute = document.querySelector("[data-bonus-map-route]");
const bonusMapPoints = document.querySelector("[data-bonus-map-points]");
const FLIP_DELAY = 4e3;
const AUTO_FLIP_CLASS = "is-auto-flip";
const BONUS_STEPS = {
  1: { dep: 1, bonus: "150%", fs: "54" },
  2: { dep: 2, bonus: "30%", fs: "24" },
  3: { dep: 3, bonus: "40%", fs: "34" },
  4: { dep: 4, bonus: "50%", fs: "44" },
  5: { dep: 5, bonus: "60%", fs: "54" },
  6: { dep: 6, bonus: "70%", fs: "64" },
  7: { dep: 7, bonus: "80%", fs: "74" },
  8: { dep: 8, bonus: "100%", fs: "84" },
  9: { dep: 9, bonus: "120%", fs: "94" },
  10: { dep: 10, bonus: "150%", fs: "104" }
};
const DEP_STEP_POINTS = [
  { step: 1, x: 12.96, y: 34.89, labelPosition: "right", cardX: 12.2, cardY: 35.2 },
  { step: 2, x: 30.51, y: 17.72, labelPosition: "top", cardX: 30.4, cardY: 17.6 },
  { step: 3, x: 49.77, y: 17.86, labelPosition: "top", cardX: 49.8, cardY: 17.7 },
  { step: 4, x: 68.46, y: 21.6, labelPosition: "top", cardX: 68.4, cardY: 21.4 },
  { step: 5, x: 85.72, y: 28.34, labelPosition: "top", cardX: 85.1, cardY: 28.4 },
  { step: 6, x: 79.33, y: 61.45, labelPosition: "top", cardX: 79.4, cardY: 61.4 },
  { step: 7, x: 60.36, y: 57.41, labelPosition: "top", cardX: 60.4, cardY: 57.3 },
  { step: 8, x: 41.56, y: 58.72, labelPosition: "top", cardX: 41.5, cardY: 58.7 },
  { step: 9, x: 22.37, y: 61.46, labelPosition: "top", cardX: 22.5, cardY: 61.4 },
  { step: 10, x: 49.8, y: 78, labelPosition: "top", cardX: 49.8, cardY: 78 }
];
const ROUTE_SEGMENTS = [
  {
    from: 1,
    to: 2,
    paths: [
      "M 15.3 32.9 Q 17.4 33.1, 18.2 29.1",
      "M 18.4 28.2 Q 19.6 23.8, 23.5 22",
      "M 24.2 21.7 Q 26.7 18.9, 28.2 18.5"
    ]
  },
  {
    from: 2,
    to: 3,
    paths: [
      "M 32.7 18.6 Q 35 20.3, 38.4 20.7",
      "M 39.3 20.8 Q 42.3 21.4, 45 19.4",
      "M 45.9 19 Q 47.7 18, 47.5 18.1"
    ]
  },
  {
    from: 3,
    to: 4,
    paths: [
      "M 52 18.6 Q 53.7 20, 56.6 19.2",
      "M 57.5 18.9 Q 60.5 17.2, 63.2 18.7",
      "M 64 19.1 Q 66.1 21.1, 66.5 21.3"
    ]
  },
  {
    from: 4,
    to: 5,
    paths: [
      "M 70.4 22.5 Q 72.2 23.2, 73.8 26.6",
      "M 74.4 27.4 Q 76.8 30.8, 80.1 30.2",
      "M 81 29.9 Q 83.1 28.4, 83.7 28.5"
    ]
  },
  {
    from: 5,
    to: 6,
    paths: [
      "M 86.4 31 Q 89.8 35.8, 89.7 42.4",
      "M 89.5 43.8 Q 89.1 50.2, 85.3 54.6",
      "M 84.6 55.4 Q 81.7 58.5, 80.8 59.5"
    ]
  },
  {
    from: 6,
    to: 7,
    paths: [
      "M 77.3 60.8 Q 74.3 58.8, 70 57.7",
      "M 69.1 57.5 Q 66.2 56.9, 63.5 58.1",
      "M 62.7 58.3 Q 61.4 58.5, 62 58"
    ]
  },
  {
    from: 7,
    to: 8,
    paths: [
      "M 58.7 58.1 Q 56.7 58.5, 54 59.6",
      "M 53.1 59.9 Q 50.1 60.9, 47.3 59.8",
      "M 46.5 59.4 Q 44.1 58.4, 43.1 58.7"
    ]
  },
  {
    from: 8,
    to: 9,
    paths: [
      "M 39.8 58.8 Q 37.1 59.5, 34.2 58.3",
      "M 33.4 58 Q 30.1 56.8, 27.3 59",
      "M 26.6 59.5 Q 24.7 61.7, 24 61.6"
    ]
  },
  {
    from: 9,
    to: 10,
    paths: [
      "M 21.8 63.2 Q 20.2 67.6, 23.7 71.3",
      "M 24.5 72 Q 29.4 77, 37.3 76.5",
      "M 38.4 76.4 Q 44.4 76.1, 47.8 77.4"
    ]
  }
];
let activeFlipInterval = null;
const clampBonusStep = (value) => {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number) || number < 1) return 1;
  return Math.min(number, MAX_DEPOSITS);
};
const stopAutoFlip = () => {
  if (activeFlipInterval) {
    clearInterval(activeFlipInterval);
    activeFlipInterval = null;
  }
  bonusCards.forEach((card) => {
    card.classList.remove(AUTO_FLIP_CLASS, "is-flipped");
    delete card.dataset.flipStarted;
  });
};
const startCardHintFlip = (card) => {
  if (!card || card.dataset.flipStarted === "true") return;
  stopAutoFlip();
  card.dataset.flipStarted = "true";
  card.classList.add(AUTO_FLIP_CLASS);
  activeFlipInterval = setInterval(() => {
    if (card.classList.contains("is-done")) {
      card.classList.remove("is-flipped", AUTO_FLIP_CLASS);
      return;
    }
    card.classList.toggle("is-flipped");
  }, FLIP_DELAY);
};
const createBonusMapOverlay = () => {
  if (!bonusMapRoute || !bonusMapPoints) return;
  bonusMapRoute.innerHTML = "";
  bonusMapPoints.innerHTML = "";
  const routeLayerConfigs = [
    { name: "base", className: "bonus-map-route__path bonus-map-route__path--base" },
    { name: "completed", className: "bonus-map-route__path bonus-map-route__path--completed" },
    { name: "guide", className: "bonus-map-route__path bonus-map-route__path--guide" }
  ];
  routeLayerConfigs.forEach(({ name, className }) => {
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.dataset.routeLayer = name;
    ROUTE_SEGMENTS.forEach(({ from, to, paths }) => {
      paths.forEach((path, index) => {
        const segment = document.createElementNS("http://www.w3.org/2000/svg", "path");
        segment.setAttribute("d", path);
        segment.setAttribute("pathLength", "100");
        segment.dataset.routeFrom = from;
        segment.dataset.routeTo = to;
        segment.dataset.routeFragment = index;
        segment.classList.add(...className.split(" "));
        layer.append(segment);
      });
    });
    bonusMapRoute.append(layer);
  });
  DEP_STEP_POINTS.forEach(({ step, x, y, cardX, cardY, labelPosition }) => {
    const marker = document.createElement("span");
    const stepData = BONUS_STEPS[step];
    marker.className = "bonus-map-step";
    marker.dataset.mapStep = step;
    marker.dataset.labelPosition = labelPosition;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.innerHTML = `
      <span class="bonus-map-step__state" aria-hidden="true">
        <span class="bonus-map-step__number">${stepData.dep}</span>
      </span>
      <span class="bonus-map-step__lock" aria-hidden="true"></span>
    `;
    bonusMapPoints.append(marker);
    const currentCard = document.createElement("span");
    currentCard.className = "bonus-map-current-card";
    currentCard.dataset.currentCardStep = step;
    currentCard.style.left = `${cardX}%`;
    currentCard.style.top = `${cardY}%`;
    currentCard.innerHTML = `
      <span class="bonus-map-current-card__dep">DEP <strong>${stepData.dep}</strong></span>
      <span class="bonus-map-current-card__bonus">BONUS ${stepData.bonus}</span>
      <span class="bonus-map-current-card__fs">+ ${stepData.fs} FS</span>
    `;
    bonusMapPoints.append(currentCard);
  });
  const finalMessage = document.createElement("span");
  finalMessage.className = "bonus-map-final-message";
  finalMessage.innerHTML = `
    <span>¡Tu premio</span>
    <span>final!</span>
  `;
  bonusMapPoints.append(finalMessage);
};
const updateBonusMapOverlay = (currentStep) => {
  if (!bonusMap || !bonusMapRoute || !bonusMapPoints) return;
  const step = clampBonusStep(currentStep);
  bonusMap.dataset.currentStep = step;
  bonusMapRoute.querySelectorAll("[data-route-layer='completed'] [data-route-to]").forEach((segment) => {
    const routeTo = Number.parseInt(segment.dataset.routeTo, 10);
    segment.classList.toggle("is-visible", routeTo <= step);
  });
  bonusMapRoute.querySelectorAll("[data-route-layer='guide'] [data-route-to]").forEach((segment) => {
    const routeFrom = Number.parseInt(segment.dataset.routeFrom, 10);
    const routeTo = Number.parseInt(segment.dataset.routeTo, 10);
    const isNextGuide = routeFrom === step && routeTo === step + 1;
    segment.classList.toggle("is-visible", isNextGuide);
  });
  bonusMapPoints.querySelectorAll("[data-map-step]").forEach((marker) => {
    const markerStep = Number.parseInt(marker.dataset.mapStep, 10);
    marker.classList.toggle("is-completed", markerStep < step);
    marker.classList.toggle("is-current", markerStep === step);
    marker.classList.toggle("is-locked", markerStep > step);
  });
  bonusMapPoints.querySelectorAll("[data-current-card-step]").forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.currentCardStep, 10);
    card.classList.toggle("is-visible", cardStep === step);
  });
};
const setBonusJourneyStep = (currentStep) => {
  const step = clampBonusStep(currentStep);
  stopAutoFlip();
  bonusCards.forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.depositCard, 10);
    const isCompleted = cardStep < step;
    const isCurrent = cardStep === step;
    const isLocked = cardStep > step;
    card.classList.toggle("is-completed", isCompleted);
    card.classList.toggle("is-current", isCurrent);
    card.classList.toggle("is-locked", isLocked);
    card.classList.toggle("is-done", isCompleted);
    card.classList.toggle("is-active", isCurrent);
  });
  updateBonusMapOverlay(step);
  startCardHintFlip(bonusCards[step - 1]);
};
const initLockedCardsAnimation = () => {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        if (card.classList.contains("is-locked") && !card.classList.contains("is-lock-animated")) {
          card.classList.add("is-lock-animated");
        }
        observer.unobserve(card);
      });
    },
    {
      threshold: 0.35
    }
  );
  bonusCards.forEach((card) => observer.observe(card));
};
const initMapLockAnimation = () => {
  if (!bonusMap || !("IntersectionObserver" in window)) return;
  const lockMarkers = bonusMap.querySelectorAll("[data-map-step]");
  if (!lockMarkers.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-map-lock-animated");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.45
    }
  );
  lockMarkers.forEach((marker) => observer.observe(marker));
};
const initBonusMap = async () => {
  createBonusMapOverlay();
  initLockedCardsAnimation();
  initMapLockAnimation();
  {
    setBonusJourneyStep(CURRENT_BONUS_STEP);
    return;
  }
};
bonusCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains(AUTO_FLIP_CLASS)) return;
    card.classList.toggle("is-flipped");
  });
});
initBonusMap();
