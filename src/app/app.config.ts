import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { LOCALE_ID } from '@angular/core';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import esPE from '@angular/common/locales/es-PE';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

registerLocaleData(es, 'es');
registerLocaleData(esPE, 'es-PE');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNzIcons(icons),
    provideNzI18n(es_ES),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ])
    ),
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const themeService = inject(ThemeService);
      await themeService.initTheme();
      await authService.init();
    }),
  ],
};
