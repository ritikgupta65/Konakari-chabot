
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeConfig {
  primaryGradient: string;
  secondaryGradient: string;
  accentColor: string;
  logoUrl: string;
  brandName: string;
  welcomeMessage: string;
  quickActions: string[];
  badgeImages?: string[];
}

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => boolean;
}

const defaultTheme: ThemeConfig = {
  primaryGradient: 'from-gray-800 to-black',
  secondaryGradient: 'from-gray-600 to-gray-800',
  accentColor: 'gray-800',
  logoUrl: 'https://cgahzcwiqcblmkwblqaj.supabase.co/storage/v1/object/public/autosite%20data/Symmetrical%20Red%20Emblem%20on%20White%20Background.png',
  brandName: 'Eterna Clove',
  welcomeMessage: 'Welcome to The Eterna clove. How can we assist you today?',
  quickActions: ['Shop new arrivals', 'Track my order', 'Size guide', 'Contact support'],
  badgeImages: ['https://cgahzcwiqcblmkwblqaj.supabase.co/storage/v1/object/public/cellular-text-pdf/vivek%20ji.jpeg' , 'https://imgs.search.brave.com/8MbpI1_BTB60LD2aadoeZT4SMTmJgpspho-xK6S5am4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cml0em1hZ2F6aW5l/LmluL3dwLWNvbnRl/bnQvdXBsb2Fkcy8y/MDE5LzA1L0FLU0hJ/S0EtUE9EREFSLmpw/Zw']
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatbot-theme');
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    }
  }, []);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    localStorage.setItem('chatbot-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('chatbot-theme');
  };

  const exportTheme = () => {
    return JSON.stringify(theme, null, 2);
  };

  const importTheme = (themeJson: string) => {
    try {
      const importedTheme = JSON.parse(themeJson);
      setTheme({ ...defaultTheme, ...importedTheme });
      localStorage.setItem('chatbot-theme', JSON.stringify(importedTheme));
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, exportTheme, importTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
