
/** @format */

import "./home.scss"

const bonusCards = document.querySelectorAll("[data-flip-card]")

const FLIP_DELAY = 4000
const AUTO_FLIP_CLASS = "is-auto-flip"

const startCardHintFlip = (card) => {
  if (!card || card.dataset.flipStarted === "true") return

  card.dataset.flipStarted = "true"
  card.classList.add(AUTO_FLIP_CLASS)

  setInterval(() => {
    if (card.classList.contains("is-done")) {
      card.classList.remove("is-flipped")
      card.classList.remove(AUTO_FLIP_CLASS)
      return
    }

    card.classList.toggle("is-flipped")
  }, FLIP_DELAY)
}

// Клик пользователя
bonusCards.forEach((card) => {
  card.addEventListener("click", () => {
    // Автоматически крутящуюся карточку кликом не трогаем
    if (card.classList.contains(AUTO_FLIP_CLASS)) return

    // is-done теперь тоже можно переворачивать
    card.classList.toggle("is-flipped")
  })
})

// Сейчас автоматически крутится первая карточка
startCardHintFlip(bonusCards[0])

// Потом можно будет запускать следующую карточку:
// startCardHintFlip(bonusCards[1])
// startCardHintFlip(bonusCards[2])

 
