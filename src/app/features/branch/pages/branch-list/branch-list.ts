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
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { BranchResponse } from '../../models/branch-response';
import { BranchService } from '../../services/branch-service';
import { DeleteBranchesRequest } from '../../models/delete-branches-request';
import { BranchFormModal } from '../../components/branch-form-modal/branch-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-branch-list',
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
    NzSpaceModule
  ],
  templateUrl: './branch-list.html',
})
export class BranchList implements OnInit {
  private _branchService = inject(BranchService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);

  allBranches = signal<BranchResponse[]>([]);
  search = signal('');

  filteredBranches = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allBranches();
    return this.allBranches().filter(r => 
      r.name.toLowerCase().includes(term) || 
      r.code.toLowerCase().includes(term) ||
      (r.address && r.address.toLowerCase().includes(term))
    );
  });

  // Table Selection State
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly BranchResponse[] = [];
  setOfCheckedId = new Set<string>();

  ngOnInit(): void {
    this.loadBranches();
  }

  // ---------- Data Loading ----------

  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (data) => this.allBranches.set(data),
      error: (error) => {
        console.error('Error loading branches', error);
        this._messageService.error('No se pudieron cargar las sedes');
      },
    });
  }

  // ---------- Modal Management ----------

  openNewBranchModal(): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Nueva Sede',
      nzContent: BranchFormModal,
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  openEditBranchModal(branch: BranchResponse): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Editar Sede',
      nzContent: BranchFormModal,
      nzData: { branch }, // Passed to the component's `branch` property
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  // ---------- Table Selection ----------

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
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  onCurrentPageDataChange(data: readonly BranchResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  // ---------- Deletion ----------

  showDeleteBranchConfirm(branch: BranchResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar la sede '${branch.name}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._branchService.delete(branch.id).subscribe({
          next: () => {
            this._messageService.success(`Sede '${branch.name}' eliminada`);
            this.setOfCheckedId.delete(branch.id);
            this.refreshCheckedStatus();
            this.loadBranches();
          },
          error: (err) => {
            console.error('Error deleting branch', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  showDeleteSelectedBranchesConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} sede(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedBranches(),
      nzCancelText: 'Cancelar',
    });
  }

  deleteSelectedBranches(): void {
    const request: DeleteBranchesRequest = {
      branchIds: Array.from(this.setOfCheckedId),
    };

    this._branchService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadBranches();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }
}
