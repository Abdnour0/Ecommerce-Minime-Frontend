import translations from './translations.js';
import { state } from './state.js';

export const SettingsManager = {
    init() {
        // Load saved settings
        try {
            state.currentLanguage = localStorage.getItem('language') || 'en';
            state.currentTheme = localStorage.getItem('theme') || 'light';
        } catch (e) {
            console.error('Error loading settings:', e);
            state.currentLanguage = 'en';
            state.currentTheme = 'light';
        }

        // Apply settings
        this.applyLanguage(state.currentLanguage);
        this.applyTheme(state.currentTheme);

        // Update UI buttons - these will be handled by the main app or specific UI modules
        this.updateLanguageButtons();
        this.updateThemeButtons();
    },

    setLanguage(lang) {
        state.currentLanguage = lang;
        try {
            localStorage.setItem('language', lang);
        } catch (e) {
            console.error('Error saving language:', e);
        }
        this.applyLanguage(lang);
        this.updateLanguageButtons();

        // Refresh dynamic content
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    },

    setTheme(theme) {
        state.currentTheme = theme;
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
        this.applyTheme(theme);
        this.updateThemeButtons();

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
    },

    applyLanguage(lang) {
        const html = document.documentElement;

        // Set direction for RTL languages
        if (lang === 'ar') {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', 'ar');
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', lang);
        }

        // Translate all elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key]) {
                if (translations[lang][key].includes('<br>') || translations[lang][key].includes('<')) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        this.updatePlaceholders(lang);
    },

    updatePlaceholders(lang) {
        const placeholders = {
            en: {
                loginEmail: 'you@example.com',
                loginPassword: 'Enter your password',
                signupFirstName: 'John',
                signupLastName: 'Doe',
                signupEmail: 'you@example.com',
                signupPassword: 'Create a password',
                signupConfirmPassword: 'Confirm your password',
                searchInput: 'Search products...',
                cardNumber: '1234 5678 9012 3456',
                expiry: 'MM/YY',
                cvv: '123',
                email: 'you@example.com'
            },
            fr: {
                loginEmail: 'vous@exemple.com',
                loginPassword: 'Entrez votre mot de passe',
                signupFirstName: 'Jean',
                signupLastName: 'Dupont',
                signupEmail: 'vous@exemple.com',
                signupPassword: 'CrÃ©er un mot de passe',
                signupConfirmPassword: 'Confirmer votre mot de passe',
                searchInput: 'Rechercher des produits...',
                cardNumber: '1234 5678 9012 3456',
                expiry: 'MM/AA',
                cvv: '123',
                email: 'vous@exemple.com'
            },
            ar: {
                loginEmail: 'you@example.com',
                loginPassword: 'Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',
                signupFirstName: 'Ù…Ø­Ù…Ø¯',
                signupLastName: 'Ø£Ø­Ù…Ø¯',
                signupEmail: 'you@example.com',
                signupPassword: 'Ø¥Ù†Ø´Ø§Ø¡ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ±',
                signupConfirmPassword: 'ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',
                searchInput: 'Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ù…Ù†ØªØ¬Ø§Øª...',
                cardNumber: '1234 5678 9012 3456',
                expiry: 'Ø´Ù‡Ø±/Ø³Ù†Ø©',
                cvv: '123',
                email: 'you@example.com'
            }
        };

        const langPlaceholders = placeholders[lang] || placeholders.en;

        Object.keys(langPlaceholders).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.placeholder = langPlaceholders[id];
            }
        });
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    updateLanguageButtons() {
        const buttons = document.querySelectorAll('.language-btn');
        buttons.forEach(btn => {
            const isActive = btn.dataset.lang === state.currentLanguage;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });
    },

    updateThemeButtons() {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === state.currentTheme);
        });
    },

    getTranslation(key) {
        return translations[state.currentLanguage]?.[key] || translations.en[key] || key;
    }
};
