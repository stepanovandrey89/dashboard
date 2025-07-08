export class FarmManager {
    constructor() {
        this.farms = [];
        this.rigIds = [];
        this.offlineThreshold = 15 * 60 * 1000; // 15 минут по умолчанию
        this.selectedFarm = null;
        this.coreTemperatureThreshold = 85;
        this.memoryTemperatureThreshold = 95;
    }

    setOfflineThreshold(threshold) {
        this.offlineThreshold = threshold;
    }

    setCoreTemperatureThreshold(threshold) {
        this.coreTemperatureThreshold = threshold;
    }

    setMemoryTemperatureThreshold(threshold) {
        this.memoryTemperatureThreshold = threshold;
    }

    async loadFarms() {
        try {
            // Загружаем список ID ферм
            const rigResponse = await fetch(`data/rig_ids.json?t=${Date.now()}`);
            this.rigIds = await rigResponse.json();

            // Загружаем данные для каждой фермы
            const farmPromises = this.rigIds.map(rig => this.loadFarmData(rig));
            const farmResults = await Promise.all(farmPromises);

            this.farms = farmResults.filter(farm => farm !== null);
            this.renderFarmsTable();

        } catch (error) {
            console.error('Ошибка загрузки ферм:', error);
            throw error;
        }
    }

    async loadFarmData(rig) {
        try {
            // Загружаем hello данные
            const helloResponse = await fetch(`data/hello_${rig.id}.json?t=${Date.now()}`);
            if (!helloResponse.ok) {
                throw new Error(`HTTP ${helloResponse.status}`);
            }
            const helloData = await helloResponse.json();

            // Проверяем наличие stats данных
            let statsData = null;
            let isOnline = false;
            let lastModified = new Date();

            try {
                const statsResponse = await fetch(`data/stats_${rig.id}.json?t=${Date.now()}`);
                if (statsResponse.ok) {
                    statsData = await statsResponse.json();
                    
                    // Получаем время последней модификации файла из заголовков
                    const lastModifiedHeader = statsResponse.headers.get('last-modified');
                    if (lastModifiedHeader) {
                        lastModified = new Date(lastModifiedHeader);
                    } else {
                        // Если заголовок недоступен, используем текущее время минус небольшой интервал
                        lastModified = new Date(Date.now() - 5 * 60 * 1000); // 5 минут назад
                    }
                    
                    // Определяем статус онлайн на основе времени последней модификации
                    const timeDiff = Date.now() - lastModified.getTime();
                    isOnline = timeDiff <= this.offlineThreshold;
                }
            } catch (statsError) {
                console.warn(`Нет stats данных для фермы ${rig.id}:`, statsError.message);
                isOnline = false;
            }

            return this.processFarmData(rig, helloData, statsData, isOnline, lastModified);

        } catch (error) {
            console.error(`Ошибка загрузки данных фермы ${rig.id}:`, error);
            return null;
        }
    }

    processFarmData(rig, helloData, statsData, isOnline, lastModified) {
        const validGPUs = helloData.params.gpu.filter(gpu => 
            gpu.brand !== 'intel' && gpu.brand !== 'cpu'
        );

        const hashrate = isOnline ? this.calculateHashrate(statsData) : 0;
        const power = isOnline ? this.calculatePower(statsData) : 0;
        const uptime = this.calculateUptime(helloData.params.boot_time);
        const solutions = isOnline ? this.getSolutions(statsData) : 0;

        return {
            id: rig.id,
            name: rig.name,
            isOnline,
            lastModified,
            gpuCount: validGPUs.length,
            gpus: validGPUs,
            hashrate,
            power,
            uptime,
            solutions,
            temperature: isOnline ? this.getAverageTemperature(statsData) : 0,
            helloData,
            statsData,
            notificationShown: false
        };
    }

    calculateHashrate(statsData) {
        if (!statsData || !statsData.params.miner_stats?.hs) return 0;
        
        let totalHashrate = statsData.params.miner_stats.hs.reduce((sum, hs) => sum + (hs || 0), 0);
        
        // Корректировка для разных майнеров
        const minerName = statsData.params.miner?.toLowerCase() || '';
        
        if (minerName.includes('rigel')) {
            totalHashrate *= 1024; // Rigel возвращает в kH/s
        } else if (minerName.includes('custom') && statsData.params.miner_stats.hs_units === 'hs') {
            // Custom майнер для QUBIC - уже в правильных единицах
            totalHashrate = totalHashrate;
        } else if (statsData.params.miner_stats.hs_units === 'hs') {
            // OneZeroMiner и другие - уже в H/s
            totalHashrate = totalHashrate;
        }
        
        return totalHashrate;
    }

    calculatePower(statsData) {
        if (!statsData) return 0;
        const powerValues = (statsData.params.power || []).filter(value => value !== 0);
        return powerValues.reduce((sum, value) => sum + value, 0);
    }

    calculateUptime(bootTime) {
        // bootTime уже в секундах Unix timestamp
        const currentTimeSeconds = Math.floor(Date.now() / 1000);
        return Math.max(0, currentTimeSeconds - bootTime);
    }

    getAverageTemperature(statsData) {
        if (!statsData) return 0;
        const temps = statsData.params.miner_stats?.temp || [];
        const validTemps = temps.filter(temp => temp > 0);
        return validTemps.length > 0 ? 
            Math.round(validTemps.reduce((sum, temp) => sum + temp, 0) / validTemps.length) : 0;
    }

    getSolutions(statsData) {
        if (!statsData) return 0;
        return statsData.params.miner_stats?.ar?.[0] || 0;
    }

    renderFarmsTable(tbodyId = 'farms-tbody-overview', showClickable = true) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        tbody.innerHTML = '';

        this.farms.forEach(farm => {
            const row = this.createFarmRow(farm, showClickable);
            tbody.appendChild(row);
        });
    }

    createFarmRow(farm, showClickable = true) {
        const row = document.createElement('tr');
        row.dataset.farmId = farm.id;
        
        const statusClass = farm.isOnline ? 'online' : 'offline';
        const statusText = farm.isOnline ? 'Online' : 'Offline';
        
        // GPU индикаторы
        const gpuIndicators = farm.gpus.map(gpu => 
            `<span class="gpu-indicator ${gpu.brand}" title="${gpu.name}"></span>`
        ).join('');

        // Форматирование хэшрейта в зависимости от значения
        let hashrateDisplay = '';
        if (farm.isOnline && farm.hashrate > 0) {
            if (farm.hashrate > 1000) {
                hashrateDisplay = (farm.hashrate / 1000).toFixed(2) + ' MH/s';
            } else {
                hashrateDisplay = farm.hashrate.toFixed(2) + ' H/s';
            }
        }

        row.innerHTML = `
            <td>
                <div class="farm-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${statusText}</span>
                </div>
            </td>
            <td class="farm-name">${farm.name}</td>
            <td>
                <div class="gpu-indicators">
                    ${gpuIndicators}
                </div>
            </td>
            <td>${farm.isOnline ? this.formatUptime(farm.uptime) : ''}</td>
            <td>${farm.isOnline ? farm.solutions.toLocaleString() : ''}</td>
            <td>${hashrateDisplay}</td>
            <td>${farm.isOnline ? farm.power + ' W' : ''}</td>
        `;

        // Добавляем обработчик клика только если нужно
        if (showClickable) {
            row.addEventListener('click', () => {
                this.selectFarm(farm);
            });
            row.style.cursor = 'pointer';
        }

        return row;
    }

    selectFarm(farm) {
        // Убираем выделение с предыдущей строки
        document.querySelectorAll('.farms-table tr').forEach(row => {
            row.classList.remove('active');
        });

        // Выделяем текущую строку
        const currentRow = document.querySelector(`tr[data-farm-id="${farm.id}"]`);
        if (currentRow) {
            currentRow.classList.add('active');
        }

        this.selectedFarm = farm;
        this.showFarmDetails(farm);
    }

    showFarmDetails(farm) {
        const detailsContainer = document.getElementById('farm-details');
        const detailsTitle = document.getElementById('details-title');
        
        detailsTitle.textContent = `Детали фермы ${farm.name}`;
        
        if (farm.isOnline) {
            this.renderOnlineFarmDetails(farm);
        } else {
            this.renderOfflineFarmDetails(farm);
        }
        
        detailsContainer.style.display = 'block';
        detailsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    renderOnlineFarmDetails(farm) {
        // Скрываем статус оффлайн
        document.getElementById('offline-status').style.display = 'none';
        
        // Показываем GPU таблицу
        document.querySelector('.gpu-table-container').style.display = 'block';
        document.querySelector('.system-info').style.display = 'block';
        
        this.renderGPUTable(farm);
        this.renderSystemInfo(farm);
    }

    renderOfflineFarmDetails(farm) {
        // Показываем статус оффлайн
        const offlineStatus = document.getElementById('offline-status');
        const offlineMessage = document.getElementById('offline-message');
        
        const timeDiff = Date.now() - farm.lastModified.getTime();
        const timeAgo = this.formatUptime(Math.floor(timeDiff / 1000));
        
        offlineMessage.textContent = `Последнее обновление: ${timeAgo} назад`;
        offlineStatus.style.display = 'block';
        
        // Скрываем остальные секции
        document.querySelector('.gpu-table-container').style.display = 'none';
        document.querySelector('.system-info').style.display = 'none';
    }

    renderGPUTable(farm) {
        const tbody = document.getElementById('gpu-details-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const busMapping = this.createBusMapping(farm.statsData, farm.gpus);

        farm.gpus.forEach((gpu, idx) => {
            const gpuStats = busMapping[gpu.busid] || {};
            
            // Расчет хэшрейта
            let hashrate = '0.00';
            let hashrateUnit = 'MH/s';
            
            if (gpuStats.hashrate && gpuStats.hashrate !== 'N/A') {
                let hsValue = parseFloat(gpuStats.hashrate);
                
                const minerName = farm.statsData.params.miner?.toLowerCase() || '';
                
                if (minerName.includes('rigel')) {
                    hsValue *= 1024;
                    hashrate = (hsValue / 1000).toFixed(2);
                    hashrateUnit = 'MH/s';
                } else if (minerName.includes('custom')) {
                    hashrate = hsValue.toFixed(2);
                    hashrateUnit = 'H/s';
                } else {
                    hashrate = (hsValue / 1000).toFixed(2);
                    hashrateUnit = 'MH/s';
                }
            }

            // Температуры
            let coreTemp = 'N/A', memoryTemp = 'N/A', fanSpeed = 'N/A';
            
            const minerName = farm.statsData.params.miner?.toLowerCase() || '';
            
            if (minerName.includes('onezerominer')) {
                // AMD майнер - используем внешние массивы
                coreTemp = farm.statsData.params.temp?.[idx + 1] || 'N/A';
                memoryTemp = farm.statsData.params.mtemp?.[idx + 1] || 'N/A';
                fanSpeed = farm.statsData.params.fan?.[idx + 1] || 'N/A';
            } else {
                // NVIDIA майнер - используем данные из busMapping
                coreTemp = gpuStats.temp || 'N/A';
                memoryTemp = farm.statsData.params.mtemp?.[idx + 1] || 'N/A';
                fanSpeed = gpuStats.fan || 'N/A';
            }

            const power = gpuStats.power || 'N/A';

            // Форматирование названия GPU
            const memorySize = Math.ceil(parseInt(gpu.mem) / 1024);
            const gpuName = `${gpu.name} ${memorySize}GB ${gpu.mem_type} (${gpu.subvendor})`;

            // Проверка критических температур
            let tempClass = '';
            const coreTemperature = parseFloat(coreTemp);
            const memoryTemperature = parseFloat(memoryTemp);
            
            if (!isNaN(coreTemperature) && coreTemperature >= this.coreTemperatureThreshold) {
                tempClass = 'critical-temp';
            } else if (!isNaN(memoryTemperature) && memoryTemperature >= this.memoryTemperatureThreshold) {
                tempClass = 'critical-temp';
            }

            // Форматирование скорости вентилятора - заменяем N/A на 0%
            let fanDisplay = '0%';
            if (fanSpeed !== 'N/A' && fanSpeed !== '0' && fanSpeed !== 0) {
                fanDisplay = fanSpeed + '%';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${idx}</td>
                <td class="${gpu.brand} gpu-name">${gpuName}</td>
                <td>${hashrate} ${hashrateUnit}</td>
                <td><span class="${tempClass}">${coreTemp}°C / ${memoryTemp}°C</span></td>
                <td>${fanDisplay}</td>
                <td>${power}W</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderSystemInfo(farm) {
        const systemInfoGrid = document.getElementById('system-info-grid');
        if (!systemInfoGrid) return;

        const hello = farm.helloData.params;
        const stats = farm.statsData.params;

        systemInfoGrid.innerHTML = `
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="circuit-board"></i>
                </div>
                <div class="info-content">
                    <span class="label">Материнская плата:</span>
                    <span class="value">${hello.mb.manufacturer} ${hello.mb.product}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="cpu"></i>
                </div>
                <div class="info-content">
                    <span class="label">Процессор:</span>
                    <span class="value">${hello.cpu.model}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="layers"></i>
                </div>
                <div class="info-content">
                    <span class="label">Количество ядер:</span>
                    <span class="value">${hello.cpu.cores}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="hard-drive"></i>
                </div>
                <div class="info-content">
                    <span class="label">Накопитель:</span>
                    <span class="value">${hello.disk_model}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="monitor"></i>
                </div>
                <div class="info-content">
                    <span class="label">Драйвер NVIDIA:</span>
                    <span class="value">${hello.nvidia_version}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="monitor"></i>
                </div>
                <div class="info-content">
                    <span class="label">Драйвер AMD:</span>
                    <span class="value">${hello.amd_version}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="pickaxe"></i>
                </div>
                <div class="info-content">
                    <span class="label">Майнер:</span>
                    <span class="value">${this.getMinerInfo(stats)}</span>
                </div>
            </div>
        `;

        // Пересоздаем иконки
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    createBusMapping(statsData, gpuData) {
        const busMapping = {};
        const powerValues = (statsData.params.power || []).filter(value => value !== 0);

        (statsData.params.miner_stats.bus_numbers || []).forEach((busNumber, idx) => {
            const busid = this.busNumberToBusid(busNumber);
            busMapping[busid] = {
                temp: statsData.params.miner_stats.temp?.[idx] || 'N/A',
                fan: statsData.params.miner_stats.fan?.[idx] || 'N/A',
                power: powerValues[idx] || 'N/A',
                hashrate: statsData.params.miner_stats.hs?.[idx] || 0
            };
        });

        return busMapping;
    }

    busNumberToBusid(busNumber) {
        return `0${busNumber.toString(16)}:00.0`;
    }

    getMinerInfo(stats) {
        if (!stats.miner_stats) return 'Unknown';
        
        const minerName = stats.miner || 'Unknown';
        const version = stats.miner_stats.ver || 'Unknown';
        const algo = stats.miner_stats.algo || 'Unknown';
        const uptime = this.formatUptime(stats.miner_stats.uptime || 0);
        
        return `${minerName} v${version}, Algo: ${algo}, Uptime: ${uptime}`;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}д`);
        if (hours > 0) parts.push(`${hours}ч`);
        if (minutes > 0) parts.push(`${minutes}м`);
        if (secs > 0 && days === 0) parts.push(`${secs}с`);
        
        return parts.join(' ') || '0с';
    }

    hideFarmDetails() {
        const detailsContainer = document.getElementById('farm-details');
        detailsContainer.style.display = 'none';
        
        // Убираем выделение со всех строк
        document.querySelectorAll('.farms-table tr').forEach(row => {
            row.classList.remove('active');
        });
        
        this.selectedFarm = null;
    }

    async updateFarms() {
        try {
            const farmPromises = this.rigIds.map(rig => this.loadFarmData(rig));
            const farmResults = await Promise.all(farmPromises);
            
            this.farms = farmResults.filter(farm => farm !== null);
            
            if (document.getElementById('overview-section').classList.contains('active')) {
                this.renderFarmsTable('farms-tbody-overview', true);
                
                // Если была выбрана ферма, обновляем её детали
                if (this.selectedFarm) {
                    const updatedFarm = this.farms.find(farm => farm.id === this.selectedFarm.id);
                    if (updatedFarm) {
                        this.selectedFarm = updatedFarm;
                        this.showFarmDetails(updatedFarm);
                    }
                }
            }
            
        } catch (error) {
            console.error('Ошибка обновления ферм:', error);
        }
    }

    getFarms() {
        return this.farms;
    }
}