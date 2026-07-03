
/** @format */

import "./home.scss"

const API_BASE_URL = "https://cbaiendpnt.site/apg/players"
// TODO: For production, move this token to backend/proxy. Do not expose Bearer token on frontend.
const AUTH_TOKEN = "cba_qiOzuJ4_BXUNQh4v_jpp4JPSFBudVgIgruA51rJla-M"
const MAX_DEPOSITS = 10

const bonusCards = document.querySelectorAll("[data-flip-card]")
const mapImages = document.querySelectorAll("[data-deposit-map]")

const FLIP_DELAY = 4000
const AUTO_FLIP_CLASS = "is-auto-flip"

let activeFlipInterval = null

const clampDepositCount = (value) => {
  const number = Number.parseInt(value, 10)

  if (Number.isNaN(number) || number < 0) return 0

  return Math.min(number, MAX_DEPOSITS)
}

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

const stopAutoFlip = () => {
  if (activeFlipInterval) {
    clearInterval(activeFlipInterval)
    activeFlipInterval = null
  }

  bonusCards.forEach((card) => {
    card.classList.remove(AUTO_FLIP_CLASS, "is-flipped")
    delete card.dataset.flipStarted
  })
}

const startCardHintFlip = (card) => {
  if (!card || card.dataset.flipStarted === "true") return

  stopAutoFlip()

  card.dataset.flipStarted = "true"
  card.classList.add(AUTO_FLIP_CLASS)

  activeFlipInterval = setInterval(() => {
    if (card.classList.contains("is-done")) {
      card.classList.remove("is-flipped", AUTO_FLIP_CLASS)
      return
    }

    card.classList.toggle("is-flipped")
  }, FLIP_DELAY)
}

const setActiveMapImage = (depositCount) => {
  const activeStep = Math.max(depositCount, 1)

  mapImages.forEach((image) => {
    const imageStep = Number.parseInt(image.dataset.depositMap, 10)

    image.classList.toggle("is-active", imageStep === activeStep)
  })
}

const setBonusProgress = (depositCount) => {
  const completedCount = clampDepositCount(depositCount)

  stopAutoFlip()

  bonusCards.forEach((card) => {
    const cardStep = Number.parseInt(card.dataset.depositCard, 10)
    const isDone = cardStep <= completedCount
    const isNext = cardStep === completedCount + 1

    card.classList.toggle("is-done", isDone)
    card.classList.toggle("is-active", isNext)
  })

  setActiveMapImage(completedCount)

  if (completedCount < MAX_DEPOSITS) {
    startCardHintFlip(bonusCards[completedCount])
  }
}

const initBonusMap = async () => {
  const playerId = getPlayerIdFromUrl()

  document.documentElement.classList.add("is-bonus-loading")

  try {
    const depositCount = playerId ? await fetchDepositCount(playerId) : 0

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
  card.addEventListener("click", () => {
    if (card.classList.contains(AUTO_FLIP_CLASS)) return

    card.classList.toggle("is-flipped")
  })
})

initBonusMap()
