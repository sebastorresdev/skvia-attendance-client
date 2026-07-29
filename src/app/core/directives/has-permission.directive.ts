import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private viewContainer = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef<any>);

  @Input('appHasPermission') set requiredPermission(permission: string | undefined) {
    this.viewContainer.clear();

    // 🔥 Si no requiere permiso → mostrar siempre
    if (!permission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    const hasPermission = this.auth.permissions().includes(permission);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

}
