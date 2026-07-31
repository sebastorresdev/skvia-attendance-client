import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private viewContainer = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef<any>);

  private requiredPermission = signal<string | undefined>(undefined);

  @Input('appHasPermission') set permission(permission: string | undefined) {
    this.requiredPermission.set(permission);
  }

  constructor() {
    effect(() => {
      const perm = this.requiredPermission();
      const userPermissions = this.auth.permissions();
      this.viewContainer.clear();

      if (!perm || userPermissions.includes(perm)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
