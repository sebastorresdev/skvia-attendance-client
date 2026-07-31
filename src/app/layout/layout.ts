import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
// NG-ZORRO
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { PERMISSIONS } from '../core/constants/permissions';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { MENU } from '../core/config/menu.config';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzBreadCrumbModule,
    NzButtonModule,
    HasPermissionDirective,
  ],
  templateUrl: './layout.html',
})
export class Layout {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  isCollapsed = false;
  readonly PERMISSIONS = PERMISSIONS;
  menu = MENU;
}
