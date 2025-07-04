(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();class D{constructor(){this.farms=[],this.rigIds=[],this.offlineThreshold=15*60*1e3,this.selectedFarm=null,this.coreTemperatureThreshold=85,this.memoryTemperatureThreshold=95}setOfflineThreshold(e){this.offlineThreshold=e}setCoreTemperatureThreshold(e){this.coreTemperatureThreshold=e}setMemoryTemperatureThreshold(e){this.memoryTemperatureThreshold=e}async loadFarms(){try{const e=await fetch("data/rig_ids.json");this.rigIds=await e.json();const t=this.rigIds.map(i=>this.loadFarmData(i)),s=await Promise.all(t);this.farms=s.filter(i=>i!==null),this.renderFarmsTable()}catch(e){throw console.error("Ошибка загрузки ферм:",e),e}}async loadFarmData(e){try{const t=await fetch(`data/hello_${e.id}.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);const s=await t.json();let i=null,n=!1,a=new Date;try{const o=await fetch(`data/stats_${e.id}.json`);if(o.ok){i=await o.json();const c=o.headers.get("last-modified");c?a=new Date(c):a=new Date(Date.now()-5*60*1e3),n=Date.now()-a.getTime()<=this.offlineThreshold}}catch(o){console.warn(`Нет stats данных для фермы ${e.id}:`,o.message),n=!1}return this.processFarmData(e,s,i,n,a)}catch(t){return console.error(`Ошибка загрузки данных фермы ${e.id}:`,t),null}}processFarmData(e,t,s,i,n){const a=t.params.gpu.filter(d=>d.brand!=="intel"&&d.brand!=="cpu"),o=i?this.calculateHashrate(s):0,c=i?this.calculatePower(s):0,r=this.calculateUptime(t.params.boot_time),l=i?this.getSolutions(s):0;return{id:e.id,name:e.name,isOnline:i,lastModified:n,gpuCount:a.length,gpus:a,hashrate:o,power:c,uptime:r,solutions:l,temperature:i?this.getAverageTemperature(s):0,helloData:t,statsData:s,notificationShown:!1}}calculateHashrate(e){var i,n;if(!e||!((i=e.params.miner_stats)!=null&&i.hs))return 0;let t=e.params.miner_stats.hs.reduce((a,o)=>a+(o||0),0);const s=((n=e.params.miner)==null?void 0:n.toLowerCase())||"";return s.includes("rigel")?t*=1024:(s.includes("custom")&&e.params.miner_stats.hs_units==="hs"||e.params.miner_stats.hs_units==="hs")&&(t=t),t}calculatePower(e){return e?(e.params.power||[]).filter(s=>s!==0).reduce((s,i)=>s+i,0):0}calculateUptime(e){return Math.floor((Date.now()-e*1e3)/1e3)}getAverageTemperature(e){var i;if(!e)return 0;const s=(((i=e.params.miner_stats)==null?void 0:i.temp)||[]).filter(n=>n>0);return s.length>0?Math.round(s.reduce((n,a)=>n+a,0)/s.length):0}getSolutions(e){var t,s;return e&&((s=(t=e.params.miner_stats)==null?void 0:t.ar)==null?void 0:s[0])||0}renderFarmsTable(e="farms-tbody-overview",t=!0){const s=document.getElementById(e);s&&(s.innerHTML="",this.farms.forEach(i=>{const n=this.createFarmRow(i,t);s.appendChild(n)}))}createFarmRow(e,t=!0){const s=document.createElement("tr");s.dataset.farmId=e.id;const i=e.isOnline?"online":"offline",n=e.isOnline?"Online":"Offline",a=e.gpus.map(c=>`<span class="gpu-indicator ${c.brand}" title="${c.name}"></span>`).join("");let o="";return e.isOnline&&e.hashrate>0&&(e.hashrate>1e3?o=(e.hashrate/1e3).toFixed(2)+" MH/s":o=e.hashrate.toFixed(2)+" H/s"),s.innerHTML=`
            <td>
                <div class="farm-status">
                    <span class="status-dot ${i}"></span>
                    <span>${n}</span>
                </div>
            </td>
            <td class="farm-name">${e.name}</td>
            <td>
                <div class="gpu-indicators">
                    ${a}
                </div>
            </td>
            <td>${e.isOnline?this.formatUptime(e.uptime):""}</td>
            <td>${e.isOnline?e.solutions.toLocaleString():""}</td>
            <td>${o}</td>
            <td>${e.isOnline?e.power+" W":""}</td>
        `,t&&(s.addEventListener("click",()=>{this.selectFarm(e)}),s.style.cursor="pointer"),s}selectFarm(e){document.querySelectorAll(".farms-table tr").forEach(s=>{s.classList.remove("active")});const t=document.querySelector(`tr[data-farm-id="${e.id}"]`);t&&t.classList.add("active"),this.selectedFarm=e,this.showFarmDetails(e)}showFarmDetails(e){const t=document.getElementById("farm-details"),s=document.getElementById("details-title");s.textContent=`Детали фермы ${e.name}`,e.isOnline?this.renderOnlineFarmDetails(e):this.renderOfflineFarmDetails(e),t.style.display="block",t.scrollIntoView({behavior:"smooth"})}renderOnlineFarmDetails(e){document.getElementById("offline-status").style.display="none",document.querySelector(".gpu-table-container").style.display="block",document.querySelector(".system-info").style.display="block",this.renderGPUTable(e),this.renderSystemInfo(e)}renderOfflineFarmDetails(e){const t=document.getElementById("offline-status"),s=document.getElementById("offline-message"),i=Date.now()-e.lastModified.getTime(),n=this.formatUptime(Math.floor(i/1e3));s.textContent=`Последнее обновление: ${n} назад`,t.style.display="block",document.querySelector(".gpu-table-container").style.display="none",document.querySelector(".system-info").style.display="none"}renderGPUTable(e){const t=document.getElementById("gpu-details-tbody");if(!t)return;t.innerHTML="";const s=this.createBusMapping(e.statsData,e.gpus);e.gpus.forEach((i,n)=>{var T,w,b,I,$,E;const a=s[i.busid]||{};let o="0.00",c="MH/s";if(a.hashrate&&a.hashrate!=="N/A"){let u=parseFloat(a.hashrate);const M=((T=e.statsData.params.miner)==null?void 0:T.toLowerCase())||"";M.includes("rigel")?(u*=1024,o=(u/1e3).toFixed(2),c="MH/s"):M.includes("custom")?(o=u.toFixed(2),c="H/s"):(o=(u/1e3).toFixed(2),c="MH/s")}let r="N/A",l="N/A",d="N/A";(((w=e.statsData.params.miner)==null?void 0:w.toLowerCase())||"").includes("onezerominer")?(r=((b=e.statsData.params.temp)==null?void 0:b[n+1])||"N/A",l=((I=e.statsData.params.mtemp)==null?void 0:I[n+1])||"N/A",d=(($=e.statsData.params.fan)==null?void 0:$[n+1])||"N/A"):(r=a.temp||"N/A",l=((E=e.statsData.params.mtemp)==null?void 0:E[n+1])||"N/A",d=a.fan||"N/A");const F=a.power||"N/A",S=Math.ceil(parseInt(i.mem)/1024),x=`${i.name} ${S}GB ${i.mem_type} (${i.subvendor})`;let h="";const f=parseFloat(r),g=parseFloat(l);(!isNaN(f)&&f>=this.coreTemperatureThreshold||!isNaN(g)&&g>=this.memoryTemperatureThreshold)&&(h="critical-temp");let v="0%";d!=="N/A"&&d!=="0"&&d!==0&&(v=d+"%");const y=document.createElement("tr");y.innerHTML=`
                <td>${n}</td>
                <td class="${i.brand} gpu-name">${x}</td>
                <td>${o} ${c}</td>
                <td><span class="${h}">${r}°C / ${l}°C</span></td>
                <td>${v}</td>
                <td>${F}W</td>
            `,t.appendChild(y)})}renderSystemInfo(e){const t=document.getElementById("system-info-grid");if(!t)return;const s=e.helloData.params,i=e.statsData.params;t.innerHTML=`
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="circuit-board"></i>
                </div>
                <div class="info-content">
                    <span class="label">Материнская плата:</span>
                    <span class="value">${s.mb.manufacturer} ${s.mb.product}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="cpu"></i>
                </div>
                <div class="info-content">
                    <span class="label">Процессор:</span>
                    <span class="value">${s.cpu.model}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="layers"></i>
                </div>
                <div class="info-content">
                    <span class="label">Количество ядер:</span>
                    <span class="value">${s.cpu.cores}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="hard-drive"></i>
                </div>
                <div class="info-content">
                    <span class="label">Накопитель:</span>
                    <span class="value">${s.disk_model}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="monitor"></i>
                </div>
                <div class="info-content">
                    <span class="label">Драйвер NVIDIA:</span>
                    <span class="value">${s.nvidia_version}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="monitor"></i>
                </div>
                <div class="info-content">
                    <span class="label">Драйвер AMD:</span>
                    <span class="value">${s.amd_version}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i data-lucide="pickaxe"></i>
                </div>
                <div class="info-content">
                    <span class="label">Майнер:</span>
                    <span class="value">${this.getMinerInfo(i)}</span>
                </div>
            </div>
        `,typeof lucide<"u"&&lucide.createIcons()}createBusMapping(e,t){const s={},i=(e.params.power||[]).filter(n=>n!==0);return(e.params.miner_stats.bus_numbers||[]).forEach((n,a)=>{var c,r,l;const o=this.busNumberToBusid(n);s[o]={temp:((c=e.params.miner_stats.temp)==null?void 0:c[a])||"N/A",fan:((r=e.params.miner_stats.fan)==null?void 0:r[a])||"N/A",power:i[a]||"N/A",hashrate:((l=e.params.miner_stats.hs)==null?void 0:l[a])||0}}),s}busNumberToBusid(e){return`0${e.toString(16)}:00.0`}getMinerInfo(e){if(!e.miner_stats)return"Unknown";const t=e.miner||"Unknown",s=e.miner_stats.ver||"Unknown",i=e.miner_stats.algo||"Unknown",n=this.formatUptime(e.miner_stats.uptime||0);return`${t} v${s}, Algo: ${i}, Uptime: ${n}`}formatUptime(e){const t=Math.floor(e/86400),s=Math.floor(e%(24*3600)/3600),i=Math.floor(e%3600/60),n=Math.floor(e%60),a=[];return t>0&&a.push(`${t}д`),s>0&&a.push(`${s}ч`),i>0&&a.push(`${i}м`),n>0&&t===0&&a.push(`${n}с`),a.join(" ")||"0с"}hideFarmDetails(){const e=document.getElementById("farm-details");e.style.display="none",document.querySelectorAll(".farms-table tr").forEach(t=>{t.classList.remove("active")}),this.selectedFarm=null}async updateFarms(){try{const e=this.rigIds.map(s=>this.loadFarmData(s)),t=await Promise.all(e);if(this.farms=t.filter(s=>s!==null),document.getElementById("overview-section").classList.contains("active")&&(this.renderFarmsTable("farms-tbody-overview",!0),this.selectedFarm)){const s=this.farms.find(i=>i.id===this.selectedFarm.id);s&&(this.selectedFarm=s,this.showFarmDetails(s))}}catch(e){console.error("Ошибка обновления ферм:",e)}}getFarms(){return this.farms}}class B{constructor(){this.container=document.getElementById("notifications-container"),this.notifications=[],this.maxNotifications=5,this.defaultDuration=5e3}show(e,t="info",s=this.defaultDuration){const i=this.createNotification(e,t,s);return this.addNotification(i),s>0&&setTimeout(()=>{this.removeNotification(i)},s),i}createNotification(e,t,s){const i=document.createElement("div");i.className=`notification ${t}`;const n=this.getIcon(t);return i.innerHTML=`
            <div class="notification-content">
                <div class="notification-icon">
                    <i data-lucide="${n}"></i>
                </div>
                <div class="notification-message">${e}</div>
                <button class="notification-close">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `,i.querySelector(".notification-close").addEventListener("click",()=>{this.removeNotification(i)}),setTimeout(()=>{typeof lucide<"u"&&lucide.createIcons()},0),i}getIcon(e){const t={success:"check-circle",error:"alert-circle",warning:"alert-triangle",info:"info"};return t[e]||t.info}addNotification(e){for(;this.notifications.length>=this.maxNotifications;){const t=this.notifications.shift();this.removeNotification(t)}this.notifications.push(e),this.container.appendChild(e),requestAnimationFrame(()=>{e.style.transform="translateX(0)",e.style.opacity="1"})}removeNotification(e){e.parentNode&&(e.style.transform="translateX(100%)",e.style.opacity="0",setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e);const t=this.notifications.indexOf(e);t>-1&&this.notifications.splice(t,1)},300))}clear(){this.notifications.forEach(e=>{this.removeNotification(e)}),this.notifications=[]}success(e,t){return this.show(e,"success",t)}error(e,t){return this.show(e,"error",t)}warning(e,t){return this.show(e,"warning",t)}info(e,t){return this.show(e,"info",t)}}class L{constructor(){this.currentTheme=this.getStoredTheme()||"dark",this.applyTheme(this.currentTheme)}getStoredTheme(){return localStorage.getItem("mining-dashboard-theme")}setStoredTheme(e){localStorage.setItem("mining-dashboard-theme",e)}applyTheme(e){document.documentElement.setAttribute("data-theme",e),this.currentTheme=e,this.setStoredTheme(e)}toggle(){const e=this.currentTheme==="dark"?"light":"dark";return this.applyTheme(e),e}getCurrentTheme(){return this.currentTheme}isDark(){return this.currentTheme==="dark"}isLight(){return this.currentTheme==="light"}}class N{constructor(){this.coinIds=["bitcoin","ethereum","layerzero-bridged-sei","ripple","solana","dogecoin","popcat","apecoin","heima","space-id","official-trump","bitcoin-cash","monero","the-open-network","magic","ethereum-classic","mantra-dao","polkadot","xelis","dogwifcoin"],this.apiUrl="https://api.coingecko.com/api/v3/coins/markets"}async loadRates(){try{const e=new URLSearchParams({vs_currency:"usd",ids:this.coinIds.join(","),sparkline:!1}),s=await(await fetch(`${this.apiUrl}?${e}`)).json();this.renderRatesGrid(s)}catch(e){console.error("Ошибка загрузки курсов:",e),this.renderErrorState()}}renderRatesGrid(e){const t=document.getElementById("rates-grid");t&&(t.innerHTML="",e.forEach(s=>{const{image:i,symbol:n,name:a,current_price:o,price_change_percentage_24h:c,market_cap:r}=s,l=document.createElement("div");l.classList.add("rate-card");const d=c>=0?"positive":"negative",p=c>=0?"trending-up":"trending-down";l.innerHTML=`
                <div class="rate-header">
                    <img src="${i}" alt="${n} logo" class="coin-logo">
                    <div class="coin-info">
                        <div class="coin-name">${a}</div>
                        <div class="coin-symbol">${n.toUpperCase()}</div>
                    </div>
                </div>
                <div class="rate-price">$${o.toLocaleString()}</div>
                <div class="rate-change ${d}">
                    <i data-lucide="${p}"></i>
                    <span>${Math.abs(c||0).toFixed(2)}%</span>
                </div>
                <div class="rate-market-cap">
                    <span class="label">Market Cap:</span>
                    <span class="value">$${this.formatMarketCap(r)}</span>
                </div>
            `,t.appendChild(l)}),typeof lucide<"u"&&lucide.createIcons())}renderErrorState(){const e=document.getElementById("rates-grid");e&&(e.innerHTML=`
            <div class="error-state">
                <i data-lucide="wifi-off"></i>
                <h3>Ошибка загрузки курсов</h3>
                <p>Не удалось загрузить актуальные курсы криптовалют. Проверьте подключение к интернету.</p>
                <button class="retry-btn" onclick="window.dashboard.ratesManager.loadRates()">
                    <i data-lucide="refresh-cw"></i>
                    Попробовать снова
                </button>
            </div>
        `,typeof lucide<"u"&&lucide.createIcons())}formatMarketCap(e){return e?e>=1e12?(e/1e12).toFixed(2)+"T":e>=1e9?(e/1e9).toFixed(2)+"B":e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(2)+"K":e.toLocaleString():"N/A"}}class C{constructor(){this.farmManager=new D,this.notificationManager=new B,this.themeManager=new L,this.ratesManager=new N,this.currentSection="overview",this.updateInterval=1e4,this.updateTimer=null,this.offlineThreshold=15*60*1e3,this.timeoutOptions=[15,30,60,120,240,480,720,1440],this.currentTimeoutIndex=0,this.allPayments=[],this.poolData=null,this.init()}async init(){try{typeof lucide<"u"&&lucide.createIcons(),this.setupNavigation(),this.setupThemeToggle(),this.setupOfflineTimeoutControl(),this.setupFarmDetails(),this.setupRates(),this.setupAlertSettings(),await this.loadInitialData(),this.startAutoUpdate(),this.notificationManager.show("Дашборд успешно загружен","success")}catch(e){console.error("Ошибка инициализации:",e),this.notificationManager.show("Ошибка загрузки дашборда","error")}}setupNavigation(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",s=>{s.preventDefault();const i=t.dataset.section;this.switchSection(i)})})}switchSection(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active")}),document.querySelector(`[data-section="${e}"]`).classList.add("active"),document.querySelectorAll(".content-section").forEach(t=>{t.classList.remove("active")}),document.getElementById(`${e}-section`).classList.add("active"),this.updatePageTitle(e),this.loadSectionData(e),this.currentSection=e}updatePageTitle(e){const t={overview:"Обзор майнинга",rates:"Курсы криптовалют",earnings:"Доходы",payments:"История выплат",settings:"Настройки"},s={overview:"Мониторинг ваших майнинг ферм в реальном времени",rates:"Актуальные курсы криптовалют",earnings:"Отслеживание последних вознаграждений",payments:"Полная история всех выплат",settings:"Настройка параметров дашборда"};document.querySelector(".page-title").textContent=t[e],document.querySelector(".page-subtitle").textContent=s[e]}setupThemeToggle(){const e=document.getElementById("theme-toggle");e.addEventListener("click",()=>{this.themeManager.toggle();const t=e.querySelector("i"),s=this.themeManager.getCurrentTheme();t.setAttribute("data-lucide",s==="dark"?"sun":"moon"),typeof lucide<"u"&&lucide.createIcons()})}setupOfflineTimeoutControl(){const e=document.getElementById("timeout-decrease"),t=document.getElementById("timeout-increase");document.getElementById("timeout-value");const s=localStorage.getItem("offline-timeout");if(s){const i=this.timeoutOptions.indexOf(parseInt(s));i!==-1&&(this.currentTimeoutIndex=i)}this.updateTimeoutDisplay(),this.updateOfflineThreshold(),e.addEventListener("click",()=>{this.currentTimeoutIndex>0&&(this.currentTimeoutIndex--,this.updateTimeoutDisplay(),this.updateOfflineThreshold(),this.saveTimeoutSetting())}),t.addEventListener("click",()=>{this.currentTimeoutIndex<this.timeoutOptions.length-1&&(this.currentTimeoutIndex++,this.updateTimeoutDisplay(),this.updateOfflineThreshold(),this.saveTimeoutSetting())})}updateTimeoutDisplay(){const e=document.getElementById("timeout-value"),t=document.getElementById("timeout-decrease"),s=document.getElementById("timeout-increase"),i=this.timeoutOptions[this.currentTimeoutIndex];i>=1440?e.textContent=`${i/1440} сут`:i>=60?e.textContent=`${i/60} ч`:e.textContent=`${i} мин`,t.disabled=this.currentTimeoutIndex===0,s.disabled=this.currentTimeoutIndex===this.timeoutOptions.length-1}updateOfflineThreshold(){const e=this.timeoutOptions[this.currentTimeoutIndex];this.offlineThreshold=e*60*1e3,this.farmManager.setOfflineThreshold(this.offlineThreshold),this.notificationManager.show(`Таймаут оффлайн установлен: ${document.getElementById("timeout-value").textContent}`,"info"),this.farmManager.updateFarms()}saveTimeoutSetting(){const e=this.timeoutOptions[this.currentTimeoutIndex];localStorage.setItem("offline-timeout",e.toString())}setupFarmDetails(){const e=document.getElementById("details-close");e&&e.addEventListener("click",()=>{this.farmManager.hideFarmDetails()})}setupRates(){const e=document.getElementById("refresh-rates");e&&e.addEventListener("click",()=>{this.ratesManager.loadRates(),this.notificationManager.show("Курсы обновлены","success")})}setupAlertSettings(){const e=document.getElementById("core-temp-threshold"),t=document.getElementById("memory-temp-threshold"),s=localStorage.getItem("core-temp-threshold"),i=localStorage.getItem("memory-temp-threshold");s&&(e.value=s,this.farmManager.setCoreTemperatureThreshold(parseInt(s))),i&&(t.value=i,this.farmManager.setMemoryTemperatureThreshold(parseInt(i))),e.addEventListener("change",n=>{const a=parseInt(n.target.value);this.farmManager.setCoreTemperatureThreshold(a),localStorage.setItem("core-temp-threshold",a.toString()),this.notificationManager.show(`Критическая температура ядра установлена: ${a}°C`,"info")}),t.addEventListener("change",n=>{const a=parseInt(n.target.value);this.farmManager.setMemoryTemperatureThreshold(a),localStorage.setItem("memory-temp-threshold",a.toString()),this.notificationManager.show(`Критическая температура памяти установлена: ${a}°C`,"info")})}async loadInitialData(){try{await this.farmManager.loadFarms(),await this.loadPoolData(),this.updateOverviewStats()}catch(e){throw console.error("Ошибка загрузки данных:",e),e}}async loadPoolData(){try{const e=await fetch("data/pool.json");this.poolData=await e.json(),document.getElementById("coin-symbol").textContent=this.poolData.pool.coinSymbol,document.getElementById("coin-price").textContent=`$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`,document.getElementById("blocks-found").textContent=this.poolData.miner.totalBlocksFound,document.getElementById("coin-symbol-earnings").textContent=this.poolData.pool.coinSymbol,document.getElementById("coin-price-earnings").textContent=`$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`,document.getElementById("coin-symbol-payments").textContent=this.poolData.pool.coinSymbol,document.getElementById("coin-price-payments").textContent=`$${parseFloat(this.poolData.pool.coinPriceUsd).toFixed(2)}`,this.updateRewardsTable(this.poolData),this.allPayments=this.poolData.miner.payments,this.updateAllPaymentsTable()}catch(e){console.error("Ошибка загрузки данных пула:",e)}}updateRewardsTable(e){const t=document.getElementById("rewards-tbody");if(!t)return;const s=[{label:"Последние 60 минут",index:0},{label:"Последние 12 часов",index:1},{label:"Последние 24 часа",index:2},{label:"Сегодня",index:3},{label:"Вчера",index:4},{label:"Предыдущие 7 дней",index:5},{label:"Предыдущие 30 дней",index:6}];t.innerHTML="",s.forEach(i=>{var r;const n=((r=e.miner.sumrewards[i.index])==null?void 0:r.reward)||0,a=(n/1e8).toFixed(5),o=(n/1e8*parseFloat(e.pool.coinPriceUsd)).toFixed(2),c=document.createElement("tr");c.innerHTML=`
                <td>${i.label}</td>
                <td>${a}</td>
                <td>$${o}</td>
            `,t.appendChild(c)})}updateAllPaymentsTable(){const e=document.getElementById("all-payments-tbody"),t=document.getElementById("payments-total");if(!e||!this.poolData)return;e.innerHTML="",this.allPayments.forEach(n=>{const a=document.createElement("tr"),o=new Date(n.timestamp*1e3).toLocaleString("ru-RU"),c=(n.amount/1e8).toFixed(5);a.innerHTML=`
                <td>${o}</td>
                <td class="tx-hash">${n.tx}</td>
                <td>${c}</td>
            `,e.appendChild(a)});const s=this.allPayments.reduce((n,a)=>n+a.amount/1e8,0),i=s*parseFloat(this.poolData.pool.coinPriceUsd);t.innerHTML=`
            <div class="label">Итого выплачено:</div>
            <div class="value">${s.toFixed(2)} XEL ($${i.toFixed(2)})</div>
        `,typeof lucide<"u"&&lucide.createIcons()}updateOverviewStats(){const e=this.farmManager.getFarms(),t=e.filter(r=>r.isOnline),s=e.filter(r=>!r.isOnline),i=t.reduce((r,l)=>r+l.gpuCount,0),n=t.reduce((r,l)=>r+l.hashrate,0),a=t.reduce((r,l)=>r+l.power,0);document.getElementById("farms-count").textContent=t.length,document.getElementById("offline-farms-count").textContent=`${s.length} неактивных`,document.getElementById("gpu-count").textContent=i;const o=document.getElementById("hashrate");n>1e3?(o.textContent=(n/1e3).toFixed(2),o.setAttribute("data-unit","MH/s")):(o.textContent=n.toFixed(2),o.setAttribute("data-unit","H/s"));const c=document.getElementById("power-consumption");c.textContent=(a/1e3).toFixed(2),c.setAttribute("data-unit","kW"),s.length>0&&s.forEach(r=>{r.notificationShown||(this.notificationManager.show(`Ферма ${r.name} не в сети`,"warning"),r.notificationShown=!0)}),this.farmManager.renderFarmsTable("farms-tbody-overview",!0)}async loadSectionData(e){switch(e){case"overview":this.updateOverviewStats();break;case"rates":await this.ratesManager.loadRates();break;case"earnings":this.poolData&&this.updateRewardsTable(this.poolData);break;case"payments":this.updateAllPaymentsTable();break}}startAutoUpdate(){this.updateTimer=setInterval(async()=>{try{await this.farmManager.updateFarms(),this.updateOverviewStats()}catch(e){console.error("Ошибка автообновления:",e)}},this.updateInterval)}stopAutoUpdate(){this.updateTimer&&(clearInterval(this.updateTimer),this.updateTimer=null)}}document.addEventListener("DOMContentLoaded",()=>{window.dashboard=new C});window.addEventListener("error",m=>{console.error("Глобальная ошибка:",m.error)});window.addEventListener("unhandledrejection",m=>{console.error("Необработанный промис:",m.reason)});
