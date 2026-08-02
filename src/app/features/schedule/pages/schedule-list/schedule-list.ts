import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ScheduleResponse } from '../../models/schedule';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleFormModal } from '../../components/schedule-form-modal/schedule-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-schedule-list',
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
    NzTagModule
  ],
  templateUrl: './schedule-list.html',
})
export class ScheduleList implements OnInit {
  private _scheduleService = inject(ScheduleService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);

  allSchedules = signal<ScheduleResponse[]>([]);
  search = signal('');

  filteredSchedules = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allSchedules();
    return this.allSchedules().filter(r => 
      r.name.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this._scheduleService.getSchedules().subscribe({
      next: (data: ScheduleResponse[]) => this.allSchedules.set(data),
      error: (error: any) => {
        console.error('Error loading schedules', error);
        this._messageService.error('No se pudieron cargar los turnos');
      },
    });
  }

  openNewScheduleModal(): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Nuevo Turno Base',
      nzContent: ScheduleFormModal,
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadSchedules();
    });
  }

  openEditScheduleModal(schedule: ScheduleResponse): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Editar Turno Base',
      nzContent: ScheduleFormModal,
      nzData: { schedule }, 
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadSchedules();
    });
  }

  showDeleteConfirm(schedule: ScheduleResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar el turno '${schedule.name}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._scheduleService.delete(schedule.id).subscribe({
          next: () => {
            this._messageService.success(`Turno '${schedule.name}' eliminado`);
            this.loadSchedules();
          },
          error: (err: any) => {
            console.error('Error deleting schedule', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }
}
