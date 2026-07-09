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
const API_BASE_URL = "https://cbaiendpnt.site/apg/players";
const AUTH_TOKEN = "cba_qiOzuJ4_BXUNQh4v_jpp4JPSFBudVgIgruA51rJla-M";
const MAX_DEPOSITS = 10;
const bonusCards = document.querySelectorAll("[data-flip-card]");
const mapImages = document.querySelectorAll("[data-deposit-map]");
const mapPulseMarker = document.querySelector("[data-map-pulse]");
const FLIP_DELAY = 4e3;
const AUTO_FLIP_CLASS = "is-auto-flip";
const MAP_POINT_POSITIONS = {
  1: { x: 12.6, y: 34.7 },
  2: { x: 30.3, y: 17.9 },
  3: { x: 49.7, y: 17.8 },
  4: { x: 68.5, y: 21.5 },
  5: { x: 85.7, y: 28.2 },
  6: { x: 79.2, y: 61.4 },
  7: { x: 60.3, y: 57.8 },
  8: { x: 41.5, y: 58 },
  9: { x: 22.1, y: 61.4 },
  10: { x: 49.9, y: 74 }
};
let activeFlipInterval = null;
const clampDepositCount = (value) => {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number) || number < 0) return 0;
  return Math.min(number, MAX_DEPOSITS);
};
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
const setActiveMapImage = (depositCount) => {
  const activeStep = Math.max(depositCount, 1);
  mapImages.forEach((image) => {
    const imageStep = Number.parseInt(image.dataset.depositMap, 10);
    image.classList.toggle("is-active", imageStep === activeStep);
  });
};
const setNextMapPulse = (depositCount) => {
  if (!mapPulseMarker) return;
  const activeStep = Math.max(depositCount, 1);
  const nextStep = activeStep + 1;
  const position = MAP_POINT_POSITIONS[nextStep];
  mapPulseMarker.classList.toggle("is-hidden", !position);
  if (!position) return;
  mapPulseMarker.style.setProperty("--pulse-x", `${position.x}%`);
  mapPulseMarker.style.setProperty("--pulse-y", `${position.y}%`);
};
const setBonusProgress = (depositCount) => {
  const completedCount = clampDepositCount(depositCount);
  stopAutoFlip();
  bonusCards.forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.depositCard, 10);
    const isDone = cardStep <= completedCount;
    const isNext = cardStep === completedCount + 1;
    const isLocked = cardStep > completedCount + 1;
    card.classList.toggle("is-done", isDone);
    card.classList.toggle("is-active", isNext);
    card.classList.toggle("is-locked", isLocked);
  });
  setActiveMapImage(completedCount);
  setNextMapPulse(completedCount);
  if (completedCount < MAX_DEPOSITS) {
    startCardHintFlip(bonusCards[completedCount]);
  }
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
  card.addEventListener("click", () => {
    if (card.classList.contains(AUTO_FLIP_CLASS) || card.classList.contains("is-locked")) return;
    card.classList.toggle("is-flipped");
  });
});
window.setBonusMapStep = (depositCount) => {
  const completedCount = clampDepositCount(depositCount);
  setBonusProgress(completedCount);
  return completedCount;
};
initBonusMap();
