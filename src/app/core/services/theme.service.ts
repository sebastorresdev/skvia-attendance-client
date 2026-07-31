import { Injectable, signal } from '@angular/core';

export type ThemeType = 'theme-default' | 'theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<ThemeType>(
    (localStorage.getItem('theme') as ThemeType) || 'theme-default'
  );

  initTheme(): Promise<void> {
    return this.loadTheme(this.currentTheme());
  }

  toggleTheme(): void {
    const nextTheme: ThemeType =
      this.currentTheme() === 'theme-default' ? 'theme-dark' : 'theme-default';
    this.loadTheme(nextTheme);
  }

  loadTheme(theme: ThemeType): Promise<void> {
    return new Promise((resolve) => {
      this.currentTheme.set(theme);
      localStorage.setItem('theme', theme);

      // 1. Alternar clase 'dark' en <html> para utilidades dark: de Tailwind CSS
      if (theme === 'theme-dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Cargar la hoja de estilos de NG-ZORRO usando ruta absoluta /${theme}.css
      const linkId = 'app-theme';
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `/${theme}.css`;
      resolve();
    });
  }
}
