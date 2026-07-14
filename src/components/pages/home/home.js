/** @format */

import "./home.scss"

const API_BASE_URL = "https://cbaiendpnt.site/apg/players"
// Temporary compatibility only. Move the API call and token to a server-side proxy.
const AUTH_TOKEN = "cba_qiOzuJ4_BXUNQh4v_jpp4JPSFBudVgIgruA51rJla-M"
const MAX_DEPOSITS = 10
const CARD_FLIP_DELAY = 4000
const AUTO_FLIP_CLASS = "is-auto-flip"

const bonusCards = [...document.querySelectorAll("[data-flip-card]")]
const mapRoutes = document.querySelectorAll("[data-map-route]")
const mapPoints = document.querySelectorAll("[data-map-point]")
const currentBonusCard = document.querySelector("[data-current-bonus-card]")
const heroMapWrap = document.querySelector("[data-bonus-map]")
const heroCtaWrapper = document.querySelector(".hero__button-wrapper")
const mobileCardsMedia = window.matchMedia("(max-width: 780px)")
const mobileCtaPositionMedia = window.matchMedia("(max-width: 480px)")
const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")
const ctaReleaseTarget = document.querySelector(".bonus-steps__link")

const currentBonusElements = {
  step: document.querySelector("[data-bonus-card-step]"),
  number: document.querySelector("[data-bonus-card-number]"),
  bonus: document.querySelector("[data-bonus-card-bonus]"),
  spins: document.querySelector("[data-bonus-card-spins]"),
  deposit: document.querySelector("[data-bonus-card-deposit]"),
}

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
  { bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" },
]

let activeFlipCard = null
let activeFlipTimer = null
let isAutoFlipPaused = false

const clampDepositCount = (value) => {
  const count = Number.parseInt(value, 10)
  return Number.isNaN(count) || count < 0 ? 0 : Math.min(count, MAX_DEPOSITS)
}

const getActiveStep = (completedCount) =>
  Math.min(completedCount + 1, MAX_DEPOSITS)

const getNumberImage = (step) => {
  const number = String(step).padStart(2, "0")
  return new URL(
    `../../../assets/img/hero/deposit-numbers/${number}.svg`,
    import.meta.url,
  ).href
}

const parseDepositCountResponse = (text) => {
  const value = text.trim()
  if (!value) return 0

  const plainNumber = Number.parseInt(value, 10)
  if (!Number.isNaN(plainNumber)) return clampDepositCount(plainNumber)

  try {
    return clampDepositCount(JSON.parse(value)?.depositCount90days)
  } catch (error) {
    console.error("Invalid deposit count response:", error)
    return 0
  }
}

const getQueryDepositCount = () => {
  const params = new URLSearchParams(window.location.search)
  const overrideName = [
    "bonus_step",
    "map_step",
    "step",
    "progress",
    "deposits",
  ].find((name) => params.has(name))

  return overrideName ? clampDepositCount(params.get(overrideName)) : null
}

const getPlayerId = () => {
  const playerId = new URLSearchParams(window.location.search).get("player_id")
  return playerId && /^\d+$/.test(playerId) ? playerId : null
}

const fetchDepositCount = async (playerId) => {
  const response = await fetch(
    `${API_BASE_URL}/${playerId}/deposit-count-90days`,
    {
      headers: {
        Accept: "text/plain, application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    },
  )

  if (!response.ok) throw new Error(`Deposit API error: ${response.status}`)
  return parseDepositCountResponse(await response.text())
}

const updateCurrentBonusCard = (step) => {
  const data = BONUS_DATA[step - 1]
  if (!currentBonusCard || !data) return

  currentBonusCard.dataset.currentStep = String(step)
  currentBonusElements.step?.setAttribute("aria-label", String(step))

  if (currentBonusElements.number)
    currentBonusElements.number.src = getNumberImage(step)
  if (currentBonusElements.bonus)
    currentBonusElements.bonus.textContent = data.bonus
  if (currentBonusElements.spins)
    currentBonusElements.spins.textContent = data.spins
  if (currentBonusElements.deposit)
    currentBonusElements.deposit.textContent = data.deposit
}

const updateMap = (completedCount) => {
  const currentStep = completedCount < MAX_DEPOSITS ? completedCount + 1 : null
  const nextStep = completedCount < MAX_DEPOSITS - 1 ? completedCount + 2 : null

  mapRoutes.forEach((route) => {
    route.classList.toggle(
      "is-done",
      Number(route.dataset.mapRoute) <= completedCount,
    )
  })

  mapPoints.forEach((point) => {
    const step = Number(point.dataset.mapPoint)
    const isDone = step <= completedCount
    const isCurrent = step === currentStep
    const isNext = step === nextStep

    point.classList.toggle("is-done", isDone)
    point.classList.toggle("is-current", isCurrent)
    point.classList.toggle("is-next", isNext)
    point.classList.toggle("is-locked", !isDone && !isCurrent && !isNext)
    point.classList.toggle(
      "is-final-lock",
      completedCount === 8 && step === MAX_DEPOSITS,
    )
  })
}

const clearAutoFlipTimer = () => {
  window.clearTimeout(activeFlipTimer)
  activeFlipTimer = null
}

const stopAutoFlip = () => {
  clearAutoFlipTimer()
  activeFlipCard = null
  isAutoFlipPaused = false

  bonusCards.forEach((card) =>
    card.classList.remove(AUTO_FLIP_CLASS, "is-flipped"),
  )
}

const isAutoFlipCardValid = () =>
  activeFlipCard?.classList.contains("is-active") &&
  !activeFlipCard.classList.contains("is-done") &&
  !activeFlipCard.classList.contains("is-locked")

const scheduleAutoFlip = () => {
  if (!isAutoFlipCardValid() || activeFlipTimer || isAutoFlipPaused) return

  activeFlipTimer = window.setTimeout(() => {
    activeFlipTimer = null

    if (!isAutoFlipCardValid()) {
      stopAutoFlip()
      return
    }

    activeFlipCard.classList.toggle("is-flipped")
    scheduleAutoFlip()
  }, CARD_FLIP_DELAY)
}

const startAutoFlip = (card) => {
  if (
    !card ||
    card.classList.contains("is-done") ||
    card.classList.contains("is-locked")
  )
    return

  activeFlipCard = card
  activeFlipCard.classList.add(AUTO_FLIP_CLASS)
  scheduleAutoFlip()
}

const updateStepCards = (completedCount) => {
  const activeStep = getActiveStep(completedCount)

  bonusCards.forEach((card) => {
    const step = Number(card.dataset.depositCard)

    card.classList.remove("is-flipped")
    card.classList.toggle("is-done", step <= completedCount)
    card.classList.toggle("is-active", step === activeStep)
    card.classList.toggle("is-locked", step > activeStep)
  })
}

const scrollActiveCardIntoView = () => {
  if (!mobileCardsMedia.matches) return

  const grid = document.querySelector(".bonus-steps__grid")
  const activeCard = grid?.querySelector("[data-flip-card].is-active")
  if (!grid || !activeCard) return

  requestAnimationFrame(() => {
    const targetLeft =
      activeCard.offsetLeft -
      (grid.clientWidth - activeCard.offsetWidth) / 2

    grid.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reducedMotionMedia.matches ? "auto" : "smooth",
    })
  })
}

const setBonusProgress = (value) => {
  const completedCount = clampDepositCount(value)

  stopAutoFlip()
  updateMap(completedCount)
  updateCurrentBonusCard(getActiveStep(completedCount))
  updateStepCards(completedCount)
  scrollActiveCardIntoView()

  if (completedCount < MAX_DEPOSITS) startAutoFlip(bonusCards[completedCount])
  return completedCount
}

const initCardEvents = () => {
  const pause = (card) => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return
    isAutoFlipPaused = true
    clearAutoFlipTimer()
  }

  const resume = (card) => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return
    isAutoFlipPaused = false
    scheduleAutoFlip()
  }

  bonusCards.forEach((card) => {
    card.addEventListener("mouseenter", () => pause(card))
    card.addEventListener("mouseleave", () => resume(card))
    card.addEventListener("focusin", () => pause(card))
    card.addEventListener("focusout", () => resume(card))
    card.addEventListener("click", () => {
      if (
        !card.classList.contains(AUTO_FLIP_CLASS) &&
        !card.classList.contains("is-locked")
      ) {
        card.classList.toggle("is-flipped")
      }
    })
  })
}

const initCtaRelease = () => {
  if (!ctaReleaseTarget || !("IntersectionObserver" in window)) return

  let isTargetVisible = false
  const update = () => {
    document.documentElement.classList.toggle(
      "is-cta-released",
      isTargetVisible,
    )
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      isTargetVisible = entry.isIntersecting
      update()
    },
    { rootMargin: "0px", threshold: 0.01 },
  )

  observer.observe(ctaReleaseTarget)
}

const initMobileCtaPosition = () => {
  if (!heroMapWrap || !heroCtaWrapper) return

  const gap = 16
  const updatePosition = () => {
    if (!mobileCtaPositionMedia.matches) return

    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop ?? 0
    const viewportHeight = viewport?.height ?? window.innerHeight
    const viewportBottom = viewportTop + viewportHeight
    const desiredTop = heroMapWrap.getBoundingClientRect().bottom + gap
    const maxTop = viewportBottom - heroCtaWrapper.offsetHeight - gap
    const targetTop = Math.max(viewportTop + gap, Math.min(desiredTop, maxTop))

    heroCtaWrapper.style.setProperty(
      "--hero-cta-initial-top",
      `${targetTop}px`,
    )
  }

  const updatePositionAtPageTop = () => {
    if (window.scrollY <= 1) updatePosition()
  }

  window.addEventListener("load", updatePosition, { once: true })
  window.addEventListener("orientationchange", updatePosition)
  window.visualViewport?.addEventListener("resize", updatePositionAtPageTop)

  if ("ResizeObserver" in window) {
    const mapResizeObserver = new ResizeObserver(updatePositionAtPageTop)
    mapResizeObserver.observe(heroMapWrap)
  }
}

const initBonusMap = async () => {
  document.documentElement.classList.add("is-bonus-loading")

  try {
    const manualCount = getQueryDepositCount()
    const playerId = getPlayerId()
    const depositCount =
      manualCount ?? (playerId ? await fetchDepositCount(playerId) : 0)
    setBonusProgress(depositCount)
  } catch (error) {
    console.error(error)
    document.documentElement.classList.add("is-bonus-error")
    setBonusProgress(0)
  } finally {
    document.documentElement.classList.remove("is-bonus-loading")
  }
}

window.setBonusMapStep = setBonusProgress

initCardEvents()
initCtaRelease()
initMobileCtaPosition()
initBonusMap()
