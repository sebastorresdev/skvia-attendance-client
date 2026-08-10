import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

// PROYECTO
import { WorkplaceResponse, WorkplaceService } from '../../services/workplace.service';
import { WorkplaceFormModal } from '../../components/workplace-form-modal/workplace-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-workplace-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzModalModule,
    NzInputModule,
    NzSpaceModule,
    NzTagModule,
    NzPopconfirmModule
  ],
  templateUrl: './workplace-list.html'
})
export class WorkplaceList implements OnInit {
  private _workplaceService = inject(WorkplaceService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);

  allWorkplaces = signal<WorkplaceResponse[]>([]);
  isLoading = signal(true);
  search = signal('');

  filteredWorkplaces = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allWorkplaces();
    return this.allWorkplaces().filter(w =>
      w.name.toLowerCase().includes(term) ||
      w.code.toLowerCase().includes(term) ||
      (w.address && w.address.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.loadWorkplaces();
  }

  loadWorkplaces(): void {
    this.isLoading.set(true);
    this._workplaceService.getAll().subscribe({
      next: (data) => {
        this.allWorkplaces.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading workplaces', error);
        this._messageService.error('No se pudieron cargar los lugares de marcación');
        this.isLoading.set(false);
      }
    });
  }

  openNewWorkplaceModal(): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Nuevo Lugar de Marcación',
      nzContent: WorkplaceFormModal,
      nzWidth: 650,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadWorkplaces();
    });
  }

  openEditWorkplaceModal(workplace: WorkplaceResponse): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Editar Lugar de Marcación',
      nzContent: WorkplaceFormModal,
      nzData: { workplace },
      nzWidth: 650,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadWorkplaces();
    });
  }

  deleteWorkplace(workplace: WorkplaceResponse): void {
    this._workplaceService.delete(workplace.id).subscribe({
      next: () => {
        this._messageService.success(`Lugar de marcación '${workplace.name}' eliminado`);
        this.loadWorkplaces();
      },
      error: (err) => {
        const msg = parseApiErrorMessage(err);
        this._messageService.error(msg);
      }
    });
  }
}
