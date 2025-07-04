# 🔥 CryptoDash - Mining Dashboard

Modern web dashboard for real-time mining farm monitoring with dark/light theme support and responsive design.

## 🚀 Live Demo

**Live Site:** [https://cryptodash.ru](https://cryptodash.ru)

## ✨ Key Features

### 📊 Farm Monitoring
- **Real-time status** - Online/offline tracking with animated indicators
- **Detailed GPU information** - Core and memory temperatures, fan speeds, power consumption
- **System information** - Motherboard, CPU, driver data
- **Customizable alerts** - Critical temperature and issue notifications

### 💰 Financial Analytics
- **Cryptocurrency rates** - Live prices for 20+ popular coins
- **Earnings statistics** - Rewards for various time periods
- **Payment history** - Complete transaction log
- **Automatic calculations** - USD conversion at current rates

### 🎨 User Interface
- **Dark/light theme** - One-click switching
- **Responsive design** - Optimized for all devices
- **Animations and micro-interactions** - Smooth transitions and hover effects
- **Notifications** - Informative toast messages

### ⚙️ Settings and Configuration
- **Customizable thresholds** - Critical temperatures for core and memory
- **Update intervals** - Control data refresh frequency
- **Offline timeouts** - Configure offline status detection time
- **Settings persistence** - Automatic localStorage saving

## 🛠️ Technologies

- **Frontend:** Vanilla JavaScript (ES6+), CSS3, HTML5
- **Build:** Vite
- **Icons:** Lucide Icons
- **Fonts:** Inter (Google Fonts)
- **Deploy:** Netlify
- **API:** CoinGecko API for cryptocurrency rates

## 📁 Project Structure

```
├── src/
│   ├── js/
│   │   ├── modules/
│   │   │   ├── farmManager.js      # Farm management
│   │   │   ├── notificationManager.js # Notification system
│   │   │   ├── themeManager.js     # Theme management
│   │   │   └── ratesManager.js     # Cryptocurrency rates
│   │   └── main.js                 # Main module
│   └── styles/
│       └── main.css                # Main styles
├── data/                           # JSON data
│   ├── rig_ids.json               # Farm list
│   ├── hello_*.json               # Farm configuration
│   ├── stats_*.json               # Farm statistics
│   └── pool.json                  # Pool data
├── dist/                          # Built files
└── index.html                     # Main page
```

## 🚀 Installation and Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development

1. **Clone repository**
```bash
git clone https://github.com/stepanovandrey89/dashboard.git
cd dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start dev server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

### Production Build

```bash
npm run build
```

Built files will be in the `dist/` folder.

### Preview Build

```bash
npm run preview
```

## 📊 Data Format

### Farm Configuration (rig_ids.json)
```json
[
    { "id": 1160808, "name": "NVIDIA" },
    { "id": 688026, "name": "RTX3080TI" }
]
```

### Farm Statistics (stats_*.json)
```json
{
    "method": "stats",
    "params": {
        "rig_id": "1160808",
        "temp": [0, 36, 42, 39],
        "fan": [0, 0, 30, 30],
        "power": [0, 129, 142, 133],
        "miner_stats": {
            "total_khs": 275.6,
            "hs": [37.701, 37.651, 38.222]
        }
    }
}
```

## 🎯 Implementation Features

### Responsiveness
- **Breakpoints:** 1400px, 1200px, 1024px, 768px, 480px
- **Grid systems:** CSS Grid with automatic adaptation
- **Mobile menu:** Slide-out sidebar for mobile devices

### Performance
- **Auto-refresh:** Every 10 seconds (configurable)
- **Caching:** localStorage for user settings
- **Optimization:** CSS/JS minification, image compression

### Security
- **CSP headers:** Configured in .htaccess
- **CORS policies:** Proper API request configuration
- **Data validation:** Incoming API data verification

## 🔧 Configuration

### Environment Variables
Create `.env` file for local development:
```env
VITE_API_BASE_URL=https://your-api-url.com
VITE_COINGECKO_API_KEY=your-api-key
```

### Apache Configuration (.htaccess)
```apache
# Static file caching
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    Header set Cache-Control "max-age=2592000, public"
</FilesMatch>

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License. See `LICENSE` file for details.

## 👨‍💻 Author

**Stepanov Andrei**
- GitHub: [@stepanovandrey89](https://github.com/stepanovandrey89)
- Email: stepanovandrey89@gmail.com

## 🙏 Acknowledgments

- [Lucide Icons](https://lucide.dev/) - Beautiful icons
- [CoinGecko API](https://www.coingecko.com/api) - Cryptocurrency data
- [Inter Font](https://rsms.me/inter/) - Modern typography
- [Vite](https://vitejs.dev/) - Fast build tool

---

⭐ Star this project if you found it helpful!