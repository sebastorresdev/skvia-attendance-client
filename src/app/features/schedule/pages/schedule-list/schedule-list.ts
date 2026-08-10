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
      r.description.toLowerCase().includes(term) || r.code.toLowerCase().includes(term)
    );
  });

  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

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
      nzTitle: `¿Estás seguro de que quieres eliminar el turno '${schedule.code} - ${schedule.description}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._scheduleService.delete(schedule.id).subscribe({
          next: () => {
            this._messageService.success(`Turno '${schedule.code}' eliminado`);
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

  showDeleteSelectedConfirm(): void {
    if (this.setOfCheckedId.size === 0) return;
    
    this._modalService.confirm({
      nzTitle: '¿Estás seguro de eliminar los turnos seleccionados?',
      nzContent: 'Esta acción no se puede deshacer.',
      nzOkText: 'Sí, Eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // Since we don't have a bulk delete, we'll map multiple delete calls.
        const ids = Array.from(this.setOfCheckedId);
        let deleted = 0;
        ids.forEach(id => {
          this._scheduleService.delete(id).subscribe({
            next: () => {
              deleted++;
              if (deleted === ids.length) {
                this._messageService.success('Turnos eliminados correctamente');
                this.setOfCheckedId.clear();
                this.refreshCheckedStatus();
                this.loadSchedules();
              }
            }
          });
        });
      }
    });
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(value: boolean): void {
    this.filteredSchedules().forEach(item => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  onCurrentPageDataChange($event: readonly ScheduleResponse[]): void {
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const data = this.filteredSchedules();
    this.checked = data.length > 0 && data.every(item => this.setOfCheckedId.has(item.id));
    this.indeterminate = data.some(item => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  calculateHours(schedule: ScheduleResponse): number {
    const parse = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h + m / 60;
    };
    
    let end = parse(schedule.defaultEndTime);
    let start = parse(schedule.defaultStartTime);
    
    // Si cruza la medianoche (ej: 22:00 a 06:00)
    if (end < start) end += 24;
    
    let total = end - start;

    if (schedule.hasBreak && schedule.breakStartTime && schedule.breakEndTime) {
      let bEnd = parse(schedule.breakEndTime);
      let bStart = parse(schedule.breakStartTime);
      if (bEnd < bStart) bEnd += 24;
      total -= (bEnd - bStart);
    }
    
    return total;
  }
}
