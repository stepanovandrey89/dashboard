export class GlobalSettingsManager {
    constructor() {
        this.apiUrl = 'data/global_settings.json';
        this.updateUrl = 'api/update_settings.php'; // Для будущего серверного API
        this.defaultSettings = {
            coreTemperatureThreshold: 85,
            memoryTemperatureThreshold: 95
        };
    }

    async loadGlobalSettings() {
        try {
            const response = await fetch(this.apiUrl);
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
        try {
            // В реальном проекте здесь должен быть POST запрос к серверному API
            // Пока что симулируем сохранение через уведомление
            console.log('Попытка сохранения глобальных настроек:', settings);
            
            // Для демонстрации - сохраняем в localStorage с префиксом "global"
            // В реальности это должно быть серверное API
            localStorage.setItem('demo-global-core-temp', settings.coreTemperatureThreshold.toString());
            localStorage.setItem('demo-global-memory-temp', settings.memoryTemperatureThreshold.toString());
            
            return true;
        } catch (error) {
            console.error('Ошибка сохранения глобальных настроек:', error);
            return false;
        }
    }

    // Временный метод для демонстрации - загружает из localStorage
    async loadDemoGlobalSettings() {
        const coreTemp = localStorage.getItem('demo-global-core-temp');
        const memoryTemp = localStorage.getItem('demo-global-memory-temp');
        
        return {
            coreTemperatureThreshold: coreTemp ? parseInt(coreTemp) : this.defaultSettings.coreTemperatureThreshold,
            memoryTemperatureThreshold: memoryTemp ? parseInt(memoryTemp) : this.defaultSettings.memoryTemperatureThreshold
        };
    }
}