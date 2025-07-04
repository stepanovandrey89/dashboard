export class GlobalSettingsManager {
    constructor() {
        this.defaultSettings = {
            coreTemperatureThreshold: 85,
            memoryTemperatureThreshold: 95
        };
    }

    async loadGlobalSettings() {
        try {
            // Загружаем из localStorage
            const savedCoreTemp = localStorage.getItem('global-core-temp-threshold');
            const savedMemoryTemp = localStorage.getItem('global-memory-temp-threshold');
            
            if (savedCoreTemp && savedMemoryTemp) {
                console.log('Загружены настройки из localStorage');
                return {
                    coreTemperatureThreshold: parseInt(savedCoreTemp),
                    memoryTemperatureThreshold: parseInt(savedMemoryTemp)
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
            console.log('Сохранение настроек в localStorage:', settings);
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
}