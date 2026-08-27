export type Language = 'ru' | 'en';

export interface LocalizationStrings {
  welcomeTitle: string;
  welcomeSubtitle: string;
  signIn: string;
  or: string;
  termsPrefix: string;
  termsLink: string;
}

const translations: Record<Language, LocalizationStrings> = {
  ru: {
    welcomeTitle: 'Добро пожаловать!',
    welcomeSubtitle: 'Давайте познакомимся',
    signIn: 'Войти',
    or: 'Или',
    termsPrefix: 'Продолжая, вы соглашаетесь с нашими',
    termsLink: 'Условиями Использования',
  },
  en: {
    welcomeTitle: 'Greetings!',
    welcomeSubtitle: 'Let’s get started',
    signIn: 'Sign In',
    or: 'Or',
    termsPrefix: 'By continuing, you agree with our',
    termsLink: 'Terms Of Use',
  },
};

export const getSystemLanguage = (): Language => {
  const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'ru';
  return lang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

export const useLocalization = (): LocalizationStrings => {
  const lang = getSystemLanguage();
  return translations[lang] || translations.en;
};
