export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'dark';
        this.applyTheme(this.currentTheme);
    }

    getStoredTheme() {
        return localStorage.getItem('mining-dashboard-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('mining-dashboard-theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
    }

    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'classic' : 'dark';
        this.applyTheme(newTheme);
        return newTheme;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDark() {
        return this.currentTheme === 'dark' || this.currentTheme === 'classic';
    }

    isClassic() {
        return this.currentTheme === 'classic';
    }
}