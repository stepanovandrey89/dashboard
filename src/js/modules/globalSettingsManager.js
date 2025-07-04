export class GlobalSettingsManager {
    constructor() {
        this.apiUrl = 'data/global_settings.json';
        this.updateUrl = 'api/update_settings.php';
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
        try {
            console.log('Сохранение глобальных настроек через API:', settings);
            
            // Добавляем полный путь для API
            const apiUrl = window.location.origin + '/' + this.updateUrl;
            console.log('API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coreTemperatureThreshold: settings.coreTemperatureThreshold,
                    memoryTemperatureThreshold: settings.memoryTemperatureThreshold
                })
            });

            if (response.ok) {
                const result = await response.text();
                console.log('Сырой ответ сервера:', result);
                
                try {
                    const jsonResult = JSON.parse(result);
                    console.log('Настройки успешно сохранены:', jsonResult);
                    return true;
                } catch (parseError) {
                    console.error('Ошибка парсинга JSON ответа:', parseError);
                    console.error('Ответ сервера:', result);
                    return false;
                }
            } else {
                const errorData = await response.text();
                console.error('Ошибка сервера при сохранении:', errorData);
                return false;
            }
        } catch (error) {
            console.error('Ошибка сохранения глобальных настроек:', error);
            return false;
        }
    }

    // Метод для загрузки настроек (используется вместо демо-версии)
    async loadDemoGlobalSettings() {
        // Теперь используем реальный API вместо localStorage
        return await this.loadGlobalSettings();
    }
}