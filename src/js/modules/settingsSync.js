export class SettingsSync {
    constructor(globalSettingsManager) {
        this.globalSettingsManager = globalSettingsManager;
        this.syncInterval = 30000; // 30 секунд
        this.syncTimer = null;
    }

    startSync() {
        // Синхронизация каждые 30 секунд
        this.syncTimer = setInterval(async () => {
            await this.syncSettings();
        }, this.syncInterval);
        
        console.log('Автосинхронизация настроек запущена');
    }

    stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('Автосинхронизация настроек остановлена');
        }
    }

    async syncSettings() {
        try {
            // Получаем локальные настройки
            const localTimestamp = localStorage.getItem('global-settings-timestamp');
            
            if (!localTimestamp) return;

            // Загружаем настройки с сервера
            const serverSettings = await this.globalSettingsManager.loadGlobalSettings();
            
            // Если есть изменения, уведомляем пользователя
            const localCoreTemp = localStorage.getItem('global-core-temp-threshold');
            const localMemoryTemp = localStorage.getItem('global-memory-temp-threshold');
            
            if (localCoreTemp && localMemoryTemp) {
                const localCore = parseInt(localCoreTemp);
                const localMemory = parseInt(localMemoryTemp);
                
                if (localCore !== serverSettings.coreTemperatureThreshold || 
                    localMemory !== serverSettings.memoryTemperatureThreshold) {
                    
                    console.log('Обнаружены различия в настройках');
                    
                    // Можно добавить уведомление пользователю о различиях
                    if (window.dashboard && window.dashboard.notificationManager) {
                        window.dashboard.notificationManager.show(
                            'Настройки синхронизированы с сервером', 
                            'info'
                        );
                    }
                }
            }
            
        } catch (error) {
            console.warn('Ошибка синхронизации настроек:', error);
        }
    }
}