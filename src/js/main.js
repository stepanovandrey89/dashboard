// Основной модуль приложения
import { FarmManager } from './modules/farmManager.js';
import { NotificationManager } from './modules/notificationManager.js';
import { ThemeManager } from './modules/themeManager.js';
import { RatesManager } from './modules/ratesManager.js';
import { GlobalSettingsManager } from './modules/globalSettingsManager.js';

class MiningDashboard {
    constructor() {
        this.farmManager = new FarmManager();
        this.notificationManager = new NotificationManager();
        this.themeManager = new ThemeManager();
        this.ratesManager = new RatesManager();
        this.globalSettingsManager = new GlobalSettingsManager();
        
        this.currentSection = 'overview';
        this.updateInterval = 10000; // 10 секунд
        this.updateTimer = null;
        this.offlineThreshold = 15 * 60 * 1000; // 15 минут по умолчанию
        this.timeoutOptions = [15, 30, 60, 120, 240, 480, 720, 1440]; // в минутах
        this.currentTimeoutIndex = 0;
        
        // Данные для выплат
        this.allPayments = [];
        this.poolData = null;
        
        this.init();
    }

    async init() {
        try {
            // Инициализация Lucide иконок
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Настройка навигации
            this.setupNavigation();
            
            // Настройка мобильного меню
            this.setupMobileMenu();
            
            // Настройка переключения темы
            this.setupThemeToggle();
            
            // Настройка контроля оффлайн таймаута
            this.setupOfflineTimeoutControl();
            
            // Настройка деталей ферм
            this.setupFarmDetails();
            
            // Настройка курсов
            this.setupRates();
            
            // Настройка настроек алертов
            this.setupAlertSettings();
            
            // Загружаем глобальные настройки температур
            await this.loadGlobalTemperatureSettings();
            
            // Первоначальная загрузка данных
            await this.loadInitialData();
            
            // Запуск автообновления
            this.startAutoUpdate();
            
            // Показать уведомление о запуске
            this.notificationManager.show('Дашборд успешно загружен', 'success');
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.notificationManager.show('Ошибка загрузки дашборда', 'error');
        }
    }

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (mobileToggle && sidebar && overlay) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });

            // Закрытие меню при клике на пункт навигации на мобильных
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('active');
                    }
                });
            });
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        // Обновляем активный пункт навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем выбранную секцию
        document.getElementById(`${section}-section`).classList.add('active');

        // Обновляем заголовок
        this.updatePageTitle(section);

        // Загружаем данные для секции
        this.loadSectionData(section);

        this.currentSection = section;
    }

    updatePageTitle(section) {
        const titles = {
            overview: 'Обзор майнинга',
            rates: 'Курсы криптовалют',
            earnings: 'Доходы',
            payments: 'История выплат',
            settings: 'Настройки'
        };

        const subtitles = {
            overview: 'Мониторинг ваших майнинг ферм в реальном времени',
            rates: 'Актуальные курсы криптовалют',
            earnings: 'Отслеживание последних вознаграждений',
            payments: 'Полная история всех выплат',
            settings: 'Настройка параметров дашборда'
        };

        document.querySelector('.page-title').textContent = titles[section];
        document.querySelector('.page-subtitle').textContent = subtitles[section];
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        
        themeToggle.addEventListener('click', () => {
            this.themeManager.toggle();
            
            // Обновляем иконку
            const icon = themeToggle.querySelector('i');
            const currentTheme = this.themeManager.getCurrentTheme();
            icon.setAttribute('data-lucide', currentTheme === 'classic' ? 'palette' : 'settings');
            
            // Пересоздаем иконки
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    }

    setupOfflineTimeoutControl() {
        const decreaseBtn = document.getElementById('timeout-decrease');
        const increaseBtn = document.getElementById('timeout-increase');
        const valueDisplay = document.getElementById('timeout-value');
        
        // Загружаем глобальные настройки
        this.loadGlobalSettings();
        
        this.updateTimeoutDisplay();
        this.updateOfflineThreshold();
        
        decreaseBtn.addEventListener('click', () => {
            if (this.currentTimeoutIndex > 0) {
                this.currentTimeoutIndex--;
                this.updateTimeoutDisplay();
                this.updateOfflineThreshold();
                this.saveGlobalSettings();
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            if (this.currentTimeoutIndex < this.timeoutOptions.length - 1) {
                this.currentTimeoutIndex++;
                this.updateTimeoutDisplay();
                this.updateOfflineThreshold();
                this.saveGlobalSettings();
            }
        });
    }

    loadGlobalSettings() {
        // Загружаем настройки из localStorage для таймаута (локальные)
        const savedTimeout = localStorage.getItem('local-offline-timeout');
        
        if (savedTimeout) {
            const savedIndex = this.timeoutOptions.indexOf(parseInt(savedTimeout));
            if (savedIndex !== -1) {
                this.currentTimeoutIndex = savedIndex;
            }
        }

        // Глобальные настройки температур загружаются отдельно
    }

    saveGlobalSettings() {
        // Сохраняем настройки глобально
        const minutes = this.timeoutOptions[this.currentTimeoutIndex];
        localStorage.setItem('local-offline-timeout', minutes.toString());
    }

    updateTimeoutDisplay() {
        const valueDisplay = document.getElementById('timeout-value');
        const decreaseBtn = document.getElementById('timeout-decrease');
        const increaseBtn = document.getElementById('timeout-increase');
        const minutes = this.timeoutOptions[this.currentTimeoutIndex];
        
        if (minutes >= 1440) {
            valueDisplay.textContent = `${minutes / 1440} сут`;
        } else if (minutes >= 60) {
            valueDisplay.textContent = `${minutes / 60} ч`;
        } else {
            valueDisplay.textContent = `${minutes} мин`;
        }
        
        // Обновляем состояние кнопок
        decreaseBtn.disabled = this.currentTimeoutIndex === 0;
        increaseBtn.disabled = this.currentTimeoutIndex === this.timeoutOptions.length - 1;
    }

    updateOfflineThreshold() {
        const minutes = this.timeoutOptions[this.currentTimeoutIndex];
        this.offlineThreshold = minutes * 60 * 1000;
        
        // Обновляем FarmManager
        this.farmManager.setOfflineThreshold(this.offlineThreshold);
        
        // Показываем уведомление
        this.notificationManager.show(`Таймаут оффлайн установлен: ${document.getElementById('timeout-value').textContent}`, 'info');
        
        // Перезагружаем данные ферм для обновления статусов
        this.farmManager.updateFarms();
    }

    setupFarmDetails() {
        const closeBtn = document.getElementById('details-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.farmManager.hideFarmDetails();
            });
        }
    }

    setupRates() {
        const refreshBtn = document.getElementById('refresh-rates');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.ratesManager.loadRates();
                this.notificationManager.show('Курсы обновлены', 'success');
            });
        }
    }

    setupAlertSettings() {
        this.loadGlobalTemperatureSettings();
        this.setupTemperatureInputs();
    }

    async loadGlobalTemperatureSettings() {
        try {
            // Загружаем глобальные настройки температур
            const globalSettings = await this.globalSettingsManager.loadGlobalSettings();
            
            // Применяем настройки к FarmManager
            this.farmManager.setCoreTemperatureThreshold(globalSettings.coreTemperatureThreshold);
            this.farmManager.setMemoryTemperatureThreshold(globalSettings.memoryTemperatureThreshold);
            
            // Обновляем значения в интерфейсе
            const coreThresholdInput = document.getElementById('core-temp-threshold');
            const memoryThresholdInput = document.getElementById('memory-temp-threshold');
            
            if (coreThresholdInput) {
                coreThresholdInput.value = globalSettings.coreTemperatureThreshold;
            }
            
            if (memoryThresholdInput) {
                memoryThresholdInput.value = globalSettings.memoryTemperatureThreshold;
            }
            
        } catch (error) {
            console.error('Ошибка загрузки глобальных настроек температур:', error);
        }
    }

    setupTemperatureInputs() {
        const coreThresholdInput = document.getElementById('core-temp-threshold');
        const memoryThresholdInput = document.getElementById('memory-temp-threshold');
        
        if (coreThresholdInput) {
            coreThresholdInput.addEventListener('change', async (e) => {
                const value = parseInt(e.target.value);
                
                // Применяем локально
                this.farmManager.setCoreTemperatureThreshold(value);
                
                // Сохраняем глобально
                const currentSettings = await this.globalSettingsManager.loadGlobalSettings();
                currentSettings.coreTemperatureThreshold = value;
                
                const saved = await this.globalSettingsManager.saveGlobalSettings(currentSettings);
                
                if (saved) {
                    this.notificationManager.show(
                        `Критическая температура ядра установлена: ${value}°C (сохранено локально)`, 
                        'success'
                    );
                } else {
                    this.notificationManager.show(
                        'Ошибка сохранения настроек', 
                        'error'
                    );
                }
            });
        }
        
        if (memoryThresholdInput) {
            memoryThresholdInput.addEventListener('change', async (e) => {
                const value = parseInt(e.target.value);
                
                // Применяем локально
                this.farmManager.setMemoryTemperatureThreshold(value);
                
                // Сохраняем глобально
                const currentSettings = await this.globalSettingsManager.loadGlobalSettings();
                currentSettings.memoryTemperatureThreshold = value;
                
                const saved = await this.globalSettingsManager.saveGlobalSettings(currentSettings);
                
                if (saved) {
                    this.notificationManager.show(
                        `Критическая температура памяти установлена: ${value}°C (сохранено локально)`, 
                        'success'
                    );
                } else {
                    this.notificationManager.show(
                        'Ошибка сохранения настроек', 
                        'error'
                    );
                }
            });
        }
    }

    async loadInitialData() {
        try {
            // Загружаем данные ферм
            await this.farmManager.loadFarms();
            
            // Загружаем данные пула
            await this.loadPoolData();
            
            // Обновляем статистику
            this.updateOverviewStats();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }

    async loadPoolData() {
        try {
            const response = await fetch(`data/pool.json?t=${Date.now()}`);
            this.poolData = await response.json();
            
            this.updatePoolDataInUI();
            
        } catch (error) {
            console.error('Ошибка загрузки данных пула:', error);
        }
    }

    updatePoolDataInUI() {
        if (!this.poolData) return;
        
        // Обновляем информацию о монете в обзоре
        document.getElementById('coin-symbol').textContent = this.poolData.pool.coinSymbol;
        document.getElementById('coin-price').textContent = `$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`;
        document.getElementById('blocks-found').textContent = this.poolData.miner.totalBlocksFound;
        
        // Обновляем информацию о монете в секции доходов
        document.getElementById('coin-symbol-earnings').textContent = this.poolData.pool.coinSymbol;
        document.getElementById('coin-price-earnings').textContent = `$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`;
        
        // Обновляем информацию о монете в секции выплат
        document.getElementById('coin-symbol-payments').textContent = this.poolData.pool.coinSymbol;
        document.getElementById('coin-price-payments').textContent = `$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`;
        
        // Обновляем таблицу вознаграждений
        this.updateRewardsTable(this.poolData);
        
        // Сохраняем данные выплат
        this.allPayments = this.poolData.miner.payments;
        
        // Обновляем таблицу всех выплат
        this.updateAllPaymentsTable();
    }

    updateRewardsTable(poolData) {
        const tbody = document.getElementById('rewards-tbody');
        if (!tbody) return;

        const periods = [
            { label: 'Последние 60 минут', index: 0 },
            { label: 'Последние 12 часов', index: 1 },
            { label: 'Последние 24 часа', index: 2 },
            { label: 'Сегодня', index: 3 },
            { label: 'Вчера', index: 4 },
            { label: 'Предыдущие 7 дней', index: 5 },
            { label: 'Предыдущие 30 дней', index: 6 }
        ];

        tbody.innerHTML = '';
        
        periods.forEach(period => {
            const reward = poolData.miner.sumrewards[period.index]?.reward || 0;
            const coinAmount = (reward / 1e8).toFixed(5);
            const usdAmount = (reward / 1e8 * parseFloat(poolData.pool.coinPriceUsd)).toFixed(2);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${period.label}</td>
                <td>${coinAmount}</td>
                <td>$${usdAmount}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateAllPaymentsTable() {
        const tbody = document.getElementById('all-payments-tbody');
        const totalContainer = document.getElementById('payments-total');
        
        if (!tbody || !this.poolData) return;

        tbody.innerHTML = '';
        
        // Отображаем все выплаты
        this.allPayments.forEach(payment => {
            const row = document.createElement('tr');
            const date = new Date(payment.timestamp * 1000).toLocaleString('ru-RU');
            const amount = (payment.amount / 1e8).toFixed(5);
            
            row.innerHTML = `
                <td>${date}</td>
                <td class="tx-hash">${payment.tx}</td>
                <td>${amount}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Рассчитываем итоговую сумму
        const totalXEL = this.allPayments.reduce((sum, payment) => sum + (payment.amount / 1e8), 0);
        const totalUSD = totalXEL * parseFloat(this.poolData.pool.coinPriceUsd);
        
        totalContainer.innerHTML = `
            <div class="label">Итого выплачено:</div>
            <div class="value">${totalXEL.toFixed(2)} XEL ($${totalUSD.toFixed(2)})</div>
        `;
        
        // Пересоздаем иконки
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    updateOverviewStats() {
        const farms = this.farmManager.getFarms();
        const activeFarms = farms.filter(farm => farm.isOnline);
        const offlineFarms = farms.filter(farm => !farm.isOnline);
        const totalGPUs = activeFarms.reduce((sum, farm) => sum + farm.gpuCount, 0);
        const totalHashrate = activeFarms.reduce((sum, farm) => sum + farm.hashrate, 0);
        const totalPower = activeFarms.reduce((sum, farm) => sum + farm.power, 0);
        
        // Обновляем статистические карточки
        document.getElementById('farms-count').textContent = activeFarms.length;
        
        // Убираем отображение неактивных ферм, если их нет
        const offlineElement = document.getElementById('offline-farms-count');
        if (offlineFarms.length > 0) {
            offlineElement.textContent = `${offlineFarms.length} неактивных`;
            offlineElement.style.display = 'block';
        } else {
            offlineElement.style.display = 'none';
        }
        
        document.getElementById('gpu-count').textContent = totalGPUs;
        
        // Форматируем хэшрейт с единицами измерения
        const hashrateElement = document.getElementById('hashrate');
        if (totalHashrate > 1000) {
            hashrateElement.textContent = (totalHashrate / 1000).toFixed(2);
            // Добавляем единицы измерения через CSS
            hashrateElement.setAttribute('data-unit', 'MH/s');
        } else {
            hashrateElement.textContent = totalHashrate.toFixed(2);
            hashrateElement.setAttribute('data-unit', 'H/s');
        }
        
        // Форматируем потребление энергии
        const powerElement = document.getElementById('power-consumption');
        powerElement.textContent = (totalPower / 1000).toFixed(2);
        powerElement.setAttribute('data-unit', 'kW');
        
        // Показываем уведомления об оффлайн фермах
        if (offlineFarms.length > 0) {
            offlineFarms.forEach(farm => {
                if (!farm.notificationShown) {
                    this.notificationManager.show(`Ферма ${farm.name} не в сети`, 'warning');
                    farm.notificationShown = true;
                }
            });
        }
        
        // Обновляем таблицу ферм на главной странице
        this.farmManager.renderFarmsTable('farms-tbody-overview', true);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'overview':
                this.updateOverviewStats();
                break;
            case 'rates':
                await this.ratesManager.loadRates();
                break;
            case 'earnings':
                if (this.poolData) {
                    this.updateRewardsTable(this.poolData);
                }
                break;
            case 'payments':
                this.updateAllPaymentsTable();
                break;
        }
    }

    startAutoUpdate() {
        this.updateTimer = setInterval(async () => {
            try {
                // Обновляем данные ферм
                await this.farmManager.updateFarms();
                
                // Обновляем данные пула
                await this.loadPoolData();
                
                // Обновляем статистику обзора
                this.updateOverviewStats();
                
            } catch (error) {
                console.error('Ошибка автообновления:', error);
            }
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MiningDashboard();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанный промис:', event.reason);
});