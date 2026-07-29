import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
// NG-ZORRO
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../core/services/auth.service';
import { PERMISSIONS } from '../core/constants/permissions';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { MENU } from '../core/config/menu.config';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule,HasPermissionDirective,],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  auth = inject(AuthService);
  isCollapsed = false;
  readonly PERMISSIONS = PERMISSIONS;
  menu = MENU;
}
