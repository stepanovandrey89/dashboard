// Список ID монет CoinGecko
const coinIds = [
  'bitcoin',
  'ethereum',
  'layerzero-bridged-sei',
  'ripple',
  'solana',
  'dogecoin',
  'popcat',
  'apecoin',
  'heima',
  'space-id',
  'official-trump',
  'bitcoin-cash',
  'monero',
  'the-open-network',
  'magic',
  'ethereum-classic',
  'mantra-dao',
  'polkadot',
  'xelis',
  'dogwifcoin'
]

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets'

// При первой загрузке страницы (DOMContentLoaded)
window.addEventListener('DOMContentLoaded', () => {
  // Мы показываем HomeSection по умолчанию
  // => сразу грузим курсы
  fetchPrices()
})

// Функция подгрузки и отображения цен
function fetchPrices() {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    ids: coinIds.join(','),
    sparkline: false
  })

  fetch(`${API_URL}?${params}`)
    .then(res => res.json())
    .then(data => {
      renderCards(data)
    })
    .catch(err => {
      console.error('Ошибка при получении данных:', err)
    })
}

// Функция отрисовки карточек в #cards-container
function renderCards(coinsData) {
  const container = document.getElementById('cards-container')
  if (!container) return

  container.innerHTML = ''

  coinsData.forEach(coin => {
    const { image, symbol, name, current_price, price_change_percentage_24h } = coin

    const cardEl = document.createElement('div')
    cardEl.classList.add('card')

    // Логотип
    const logoEl = document.createElement('img')
    logoEl.src = image
    logoEl.alt = `${symbol} logo`
    cardEl.appendChild(logoEl)

    // Название
    const nameEl = document.createElement('div')
    nameEl.classList.add('name')
    nameEl.textContent = name
    cardEl.appendChild(nameEl)

    // Символ
    const symbolEl = document.createElement('div')
    symbolEl.classList.add('symbol')
    symbolEl.textContent = symbol.toUpperCase()
    cardEl.appendChild(symbolEl)

    // Цена
    const priceEl = document.createElement('div')
    priceEl.classList.add('price')
    priceEl.textContent = `$${current_price.toLocaleString()}`
    cardEl.appendChild(priceEl)

    // Изменение
    const changeEl = document.createElement('div')
    const changePercent = price_change_percentage_24h?.toFixed(2) || '0.00'
    changeEl.textContent = `${changePercent}%`
    if (price_change_percentage_24h >= 0) {
      changeEl.classList.add('change-positive')
    } else {
      changeEl.classList.add('change-negative')
    }
    cardEl.appendChild(changeEl)

    container.appendChild(cardEl)
  })
}

// ===== Функции переключения секций =====

// Показать Home
function showHome() {
  // Показываем homeSection
  document.getElementById('homeSection').style.display = 'block'
  // Скрываем miningSection
  document.getElementById('miningSection').style.display = 'none'

  // Обновляем активное меню
  document.getElementById('linkHome').classList.add('active')
  document.getElementById('linkMining').classList.remove('active')

  // Снова вызываем fetchPrices, чтобы карточки заново подгрузились
  fetchPrices()
}

// Показать Mining
function showMining() {
  // Скрываем homeSection
  document.getElementById('homeSection').style.display = 'none'
  // Показываем miningSection
  document.getElementById('miningSection').style.display = 'block'

  // Меняем активное меню
  document.getElementById('linkHome').classList.remove('active')
  document.getElementById('linkMining').classList.add('active')

  // Для Майнинга ничего не делаем, оставляем
}

