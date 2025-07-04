export class GlobalSettingsManager {
    constructor() {
        this.apiUrl = 'data/global_settings.json';
        this.defaultSettings = {
            coreTemperatureThreshold: 85,
            memoryTemperatureThreshold: 95
        };
    }

    async loadGlobalSettings() {
        try {
            const response = await fetch(this.apiUrl + '?t=' + Date.now()); // Добавляем timestamp для избежания кэширования
            if (response.ok) {
                const settings = await response.json();
                return {
                    coreTemperatureThreshold: settings.coreTemperatureThreshold || this.defaultSettings.coreTemperatureThreshold,
                    memoryTemperatureThreshold: settings.memoryTemperatureThreshold || this.defaultSettings.memoryTemperatureThreshold
                };
            }
        } catch (error) {
            console.warn('Не удалось загрузить глобальные настройки:', error);
        }
        
        // Возвращаем дефолтные настройки если не удалось загрузить
        return this.defaultSettings;
    }

    async saveGlobalSettings(settings) {
        // На статическом хостинге мы не можем сохранять файлы на сервере
        // Поэтому используем localStorage как временное решение
        try {
            console.log('Сохранение настроек в localStorage (статический хостинг):', settings);
            
            // Сохраняем в localStorage
            localStorage.setItem('global-core-temp-threshold', settings.coreTemperatureThreshold.toString());
            localStorage.setItem('global-memory-temp-threshold', settings.memoryTemperatureThreshold.toString());
            localStorage.setItem('global-settings-timestamp', Date.now().toString());
            
            console.log('Настройки успешно сохранены в localStorage');
            return true;
            
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
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
            
            // Если нет сохраненных настроек, пытаемся загрузить из файла
            const response = await fetch(this.apiUrl + '?t=' + Date.now());
            if (response.ok) {
                const settings = await response.json();
                console.log('Загружены настройки из файла');
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
}