export class GlobalSettingsManager {
    constructor() {
        this.apiUrl = 'data/global_settings.json';
        this.externalApiUrl = 'https://api.jsonbin.io/v3/b'; // JSONBin.io API
        this.apiKey = '$2a$10$YOUR_API_KEY_HERE'; // Замените на ваш API ключ
        this.binId = 'YOUR_BIN_ID_HERE'; // ID вашего bin
        this.defaultSettings = {
            coreTemperatureThreshold: 85,
            memoryTemperatureThreshold: 95
        };
    }

    async loadGlobalSettings() {
        try {
            // Сначала пытаемся загрузить из localStorage (если есть сохраненные настройки)
            const savedCoreTemp = localStorage.getItem('global-core-temp-threshold');
            const savedMemoryTemp = localStorage.getItem('global-memory-temp-threshold');
            
            if (savedCoreTemp && savedMemoryTemp) {
                console.log('Загружены настройки из localStorage');
                return {
                    coreTemperatureThreshold: parseInt(savedCoreTemp),
                    memoryTemperatureThreshold: parseInt(savedMemoryTemp)
                };
            }

            // Пытаемся загрузить из внешнего API
            try {
                const response = await fetch(`${this.externalApiUrl}/${this.binId}/latest`, {
                    headers: {
                        'X-Master-Key': this.apiKey
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Загружены настройки из внешнего API');
                    return {
                        coreTemperatureThreshold: data.record.coreTemperatureThreshold || this.defaultSettings.coreTemperatureThreshold,
                        memoryTemperatureThreshold: data.record.memoryTemperatureThreshold || this.defaultSettings.memoryTemperatureThreshold
                    };
                }
            } catch (apiError) {
                console.warn('Ошибка загрузки из внешнего API:', apiError);
            }
            
            // Если внешний API недоступен, пытаемся загрузить из локального файла
            const response = await fetch(this.apiUrl + '?t=' + Date.now());
            if (response.ok) {
                const settings = await response.json();
                console.log('Загружены настройки из локального файла');
                return {
                    coreTemperatureThreshold: settings.coreTemperatureThreshold || this.defaultSettings.coreTemperatureThreshold,
                    memoryTemperatureThreshold: settings.memoryTemperatureThreshold || this.defaultSettings.memoryTemperatureThreshold
                };
            }
        } catch (error) {
            console.warn('Не удалось загрузить глобальные настройки:', error);
        }
        
        // Возвращаем дефолтные настройки если не удалось загрузить
        console.log('Используются дефолтные настройки');
        return this.defaultSettings;
    }

    async saveGlobalSettings(settings) {
        try {
            // Сохраняем в localStorage для быстрого доступа
            localStorage.setItem('global-core-temp-threshold', settings.coreTemperatureThreshold.toString());
            localStorage.setItem('global-memory-temp-threshold', settings.memoryTemperatureThreshold.toString());
            localStorage.setItem('global-settings-timestamp', Date.now().toString());

            // Пытаемся сохранить во внешний API
            if (this.apiKey !== '$2a$10$YOUR_API_KEY_HERE' && this.binId !== 'YOUR_BIN_ID_HERE') {
                try {
                    const response = await fetch(`${this.externalApiUrl}/${this.binId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Master-Key': this.apiKey
                        },
                        body: JSON.stringify({
                            ...settings,
                            lastUpdated: new Date().toISOString(),
                            updatedBy: 'web-dashboard'
                        })
                    });

                    if (response.ok) {
                        console.log('Настройки успешно сохранены во внешний API');
                        return true;
                    } else {
                        console.warn('Ошибка сохранения во внешний API:', response.status);
                    }
                } catch (apiError) {
                    console.warn('Ошибка подключения к внешнему API:', apiError);
                }
            }

            console.log('Настройки сохранены только в localStorage');
            return true;
            
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
    }

    // Метод для настройки внешнего API
    configureExternalAPI(apiKey, binId) {
        this.apiKey = apiKey;
        this.binId = binId;
        console.log('Внешний API настроен');
    }
}