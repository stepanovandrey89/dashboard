export class RatesManager {
    constructor() {
        this.coinIds = [
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
        ];
        this.apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
    }

    async loadRates() {
        try {
            const params = new URLSearchParams({
                vs_currency: 'usd',
                ids: this.coinIds.join(','),
                sparkline: false
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.json();
            
            this.renderRatesGrid(data);
        } catch (error) {
            console.error('Ошибка загрузки курсов:', error);
            this.renderErrorState();
        }
    }

    renderRatesGrid(coinsData) {
        const container = document.getElementById('rates-grid');
        if (!container) return;

        container.innerHTML = '';

        coinsData.forEach(coin => {
            const { image, symbol, name, current_price, price_change_percentage_24h, market_cap } = coin;

            const cardEl = document.createElement('div');
            cardEl.classList.add('rate-card');

            // Определяем класс для изменения цены
            const changeClass = price_change_percentage_24h >= 0 ? 'positive' : 'negative';
            const changeIcon = price_change_percentage_24h >= 0 ? 'trending-up' : 'trending-down';

            cardEl.innerHTML = `
                <div class="rate-header">
                    <img src="${image}" alt="${symbol} logo" class="coin-logo">
                    <div class="coin-info">
                        <div class="coin-name">${name}</div>
                        <div class="coin-symbol">${symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="rate-price">$${current_price.toLocaleString()}</div>
                <div class="rate-change ${changeClass}">
                    <i data-lucide="${changeIcon}"></i>
                    <span>${Math.abs(price_change_percentage_24h || 0).toFixed(2)}%</span>
                </div>
                <div class="rate-market-cap">
                    <span class="label">Market Cap:</span>
                    <span class="value">$${this.formatMarketCap(market_cap)}</span>
                </div>
            `;

            container.appendChild(cardEl);
        });

        // Пересоздаем иконки Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderErrorState() {
        const container = document.getElementById('rates-grid');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <i data-lucide="wifi-off"></i>
                <h3>Ошибка загрузки курсов</h3>
                <p>Не удалось загрузить актуальные курсы криптовалют. Проверьте подключение к интернету.</p>
                <button class="retry-btn" onclick="window.dashboard.ratesManager.loadRates()">
                    <i data-lucide="refresh-cw"></i>
                    Попробовать снова
                </button>
            </div>
        `;

        // Пересоздаем иконки Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    formatMarketCap(marketCap) {
        if (!marketCap) return 'N/A';
        
        if (marketCap >= 1e12) {
            return (marketCap / 1e12).toFixed(2) + 'T';
        } else if (marketCap >= 1e9) {
            return (marketCap / 1e9).toFixed(2) + 'B';
        } else if (marketCap >= 1e6) {
            return (marketCap / 1e6).toFixed(2) + 'M';
        } else if (marketCap >= 1e3) {
            return (marketCap / 1e3).toFixed(2) + 'K';
        }
        
        return marketCap.toLocaleString();
    }
}