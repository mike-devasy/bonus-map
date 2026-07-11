
/** @format */

import "./home.scss"

const API_BASE_URL = "https://cbaiendpnt.site/apg/players"
// TODO: For production, move this token to backend/proxy. Do not expose Bearer token on frontend.
const AUTH_TOKEN = "cba_qiOzuJ4_BXUNQh4v_jpp4JPSFBudVgIgruA51rJla-M"
const MAX_DEPOSITS = 10

const bonusCards = document.querySelectorAll("[data-flip-card]")
const mapRoutes = document.querySelectorAll("[data-map-route]")
const mapPoints = document.querySelectorAll("[data-map-point]")
const currentBonusCard = document.querySelector("[data-current-bonus-card]")
const currentBonusStep = document.querySelector("[data-bonus-card-step]")
const currentBonusNumber = document.querySelector("[data-bonus-card-number]")
const currentBonusValue = document.querySelector("[data-bonus-card-bonus]")
const currentBonusSpins = document.querySelector("[data-bonus-card-spins]")
const currentBonusDeposit = document.querySelector("[data-bonus-card-deposit]")
const mobileCardsMedia = window.matchMedia("(max-width: 780px)")
const mobileCtaMedia = window.matchMedia("(max-width: 480px)")
const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")
const ctaReleaseTarget = document.querySelector(".bonus-steps__link")

const FLIP_DELAY = 4000
const AUTO_FLIP_CLASS = "is-auto-flip"

let activeFlipInterval = null
let activeFlipCard = null
let isAutoFlipPaused = false

const bonusNumberImages = Array.from({ length: MAX_DEPOSITS }, (_, index) => {
  const number = String(index + 1).padStart(2, "0")

  return new URL(`../../../assets/img/hero/deposit-numbers/${number}.svg`, import.meta.url).href
})

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
  { step: 10, bonus: "120%", spins: "+94 FS", deposit: "5000 ARS" },
]

const clampDepositCount = (value) => {
  const number = Number.parseInt(value, 10)

  if (Number.isNaN(number) || number < 0) return 0

  return Math.min(number, MAX_DEPOSITS)
}

const getActiveStep = (completedCount) => Math.min(completedCount + 1, MAX_DEPOSITS)

const parseDepositCountResponse = (text) => {
  const trimmedText = text.trim()

  if (!trimmedText) return 0

  const plainNumber = Number.parseInt(trimmedText, 10)

  if (!Number.isNaN(plainNumber)) {
    return clampDepositCount(plainNumber)
  }

  try {
    const data = JSON.parse(trimmedText)

    return clampDepositCount(data?.depositCount90days)
  } catch (error) {
    console.error("Invalid deposit count response:", error)
    return 0
  }
}

const getPlayerIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const playerId = params.get("player_id")

  if (!playerId || !/^\d+$/.test(playerId)) return null

  return playerId
}

const getManualDepositCountFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const manualParamNames = ["bonus_step", "map_step", "step", "progress", "deposits"]
  const manualParamName = manualParamNames.find((name) => params.has(name))

  if (!manualParamName) return null

  return clampDepositCount(params.get(manualParamName))
}

const fetchDepositCount = async (playerId) => {
  const response = await fetch(`${API_BASE_URL}/${playerId}/deposit-count-90days`, {
    method: "GET",
    headers: {
      Accept: "text/plain, application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Deposit API error: ${response.status}`)
  }

  const text = await response.text()

  return parseDepositCountResponse(text)
}

const updateCurrentBonusCard = (activeStep) => {
  if (!currentBonusCard) return

  const bonus = BONUS_DATA[activeStep - 1]

  if (!bonus) return

  currentBonusCard.dataset.currentStep = String(bonus.step)

  if (currentBonusStep) currentBonusStep.setAttribute("aria-label", String(bonus.step))
  if (currentBonusNumber) currentBonusNumber.src = bonusNumberImages[bonus.step - 1]
  if (currentBonusValue) currentBonusValue.textContent = bonus.bonus
  if (currentBonusSpins) currentBonusSpins.textContent = bonus.spins
  if (currentBonusDeposit) currentBonusDeposit.textContent = bonus.deposit
}

const updateMapRoutes = (completedCount) => {
  mapRoutes.forEach((route) => {
    const routeStep = Number.parseInt(route.dataset.mapRoute, 10)

    route.classList.toggle("is-done", routeStep <= completedCount)
  })
}

const updateMapPoints = (completedCount) => {
  const currentStep = completedCount < MAX_DEPOSITS ? completedCount + 1 : null
  const nextStep = completedCount < MAX_DEPOSITS - 1 ? completedCount + 2 : null

  mapPoints.forEach((point) => {
    const pointStep = Number.parseInt(point.dataset.mapPoint, 10)
    const isDone = pointStep <= completedCount
    const isCurrent = pointStep === currentStep
    const isNext = pointStep === nextStep
    const isLocked = !isDone && !isCurrent && !isNext

    point.classList.toggle("is-done", isDone)
    point.classList.toggle("is-checked", isDone)
    point.classList.toggle("is-current", isCurrent)
    point.classList.toggle("is-next", isNext)
    point.classList.toggle("is-locked", isLocked)
    point.classList.toggle("is-final-lock", completedCount === 8 && pointStep === MAX_DEPOSITS)
  })
}

const stopAutoFlip = () => {
  if (activeFlipInterval) {
    clearInterval(activeFlipInterval)
    activeFlipInterval = null
  }

  activeFlipCard = null
  isAutoFlipPaused = false

  bonusCards.forEach((card) => {
    card.classList.remove(AUTO_FLIP_CLASS, "is-flipped")
  })
}

const clearAutoFlipTimer = () => {
  if (!activeFlipInterval) return

  clearInterval(activeFlipInterval)
  activeFlipInterval = null
}

const runAutoFlipTimer = () => {
  if (!activeFlipCard || activeFlipInterval || isAutoFlipPaused) return

  activeFlipInterval = setInterval(() => {
    if (
      !activeFlipCard.classList.contains("is-active") ||
      activeFlipCard.classList.contains("is-done") ||
      activeFlipCard.classList.contains("is-locked")
    ) {
      stopAutoFlip()
      return
    }

    activeFlipCard.classList.toggle("is-flipped")
  }, FLIP_DELAY)
}

const startCardAutoFlip = (card) => {
  if (!card || card.classList.contains("is-done") || card.classList.contains("is-locked")) return

  activeFlipCard = card
  card.classList.add(AUTO_FLIP_CLASS)
  runAutoFlipTimer()
}

const updateStepCards = (completedCount) => {
  const activeStep = getActiveStep(completedCount)

  bonusCards.forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.depositCard, 10)
    const isDone = cardStep <= completedCount
    const isActive = cardStep === activeStep
    const isLocked = cardStep > activeStep

    card.classList.remove("is-flipped")
    card.classList.toggle("is-done", isDone)
    card.classList.toggle("is-active", isActive)
    card.classList.toggle("is-locked", isLocked)
  })
}

const scrollActiveCardIntoView = () => {
  if (!mobileCardsMedia.matches) return

  const activeCard = document.querySelector("[data-flip-card].is-active")

  if (!activeCard) return

  requestAnimationFrame(() => {
    activeCard.scrollIntoView({
      behavior: reducedMotionMedia.matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    })
  })
}

const setBonusProgress = (depositCount) => {
  const completedCount = clampDepositCount(depositCount)
  const activeStep = getActiveStep(completedCount)

  stopAutoFlip()
  updateMapRoutes(completedCount)
  updateMapPoints(completedCount)
  updateCurrentBonusCard(activeStep)
  updateStepCards(completedCount)
  scrollActiveCardIntoView()

  if (completedCount < MAX_DEPOSITS) {
    startCardAutoFlip(bonusCards[completedCount])
  }

  return completedCount
}

const initBonusMap = async () => {
  const playerId = getPlayerIdFromUrl()
  const manualDepositCount = getManualDepositCountFromUrl()

  document.documentElement.classList.add("is-bonus-loading")

  try {
    const depositCount = manualDepositCount ?? (playerId ? await fetchDepositCount(playerId) : 0)

    setBonusProgress(depositCount)
  } catch (error) {
    console.error(error)
    document.documentElement.classList.add("is-bonus-error")
    setBonusProgress(0)
  } finally {
    document.documentElement.classList.remove("is-bonus-loading")
  }
}

bonusCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return

    isAutoFlipPaused = true
    clearAutoFlipTimer()
  })

  card.addEventListener("mouseleave", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return

    isAutoFlipPaused = false
    runAutoFlipTimer()
  })

  card.addEventListener("focusin", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return

    isAutoFlipPaused = true
    clearAutoFlipTimer()
  })

  card.addEventListener("focusout", () => {
    if (!card.classList.contains(AUTO_FLIP_CLASS)) return

    isAutoFlipPaused = false
    runAutoFlipTimer()
  })

  card.addEventListener("click", () => {
    if (card.classList.contains(AUTO_FLIP_CLASS)) return
    if (card.classList.contains("is-locked")) return

    card.classList.toggle("is-flipped")
  })
})

const initCtaRelease = () => {
  if (!ctaReleaseTarget || !("IntersectionObserver" in window)) return

  let isReleaseTargetVisible = false

  const updateCtaRelease = () => {
    document.documentElement.classList.toggle("is-cta-released", mobileCtaMedia.matches && isReleaseTargetVisible)
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      isReleaseTargetVisible = entry.isIntersecting
      updateCtaRelease()
    },
    {
      root: null,
      rootMargin: "0px 0px -35% 0px",
      threshold: 0.1,
    }
  )

  observer.observe(ctaReleaseTarget)
  mobileCtaMedia.addEventListener("change", updateCtaRelease)
}

window.setBonusMapStep = (depositCount) => setBonusProgress(depositCount)

initCtaRelease()
initBonusMap()
