import { Component, OnInit } from '@angular/core';
import { CommonFunctionService } from 'src/app/routes/service/common-function.service';
import { PositionFormComponent } from './position-form/position-form.component';
import { NzModalService, NzMessageService } from 'ng-zorro-antd';
import { List, ApiData } from 'src/app/data/interface.data';
import { SettingsConfigService } from 'src/app/routes/service/settings-config.service';

@Component({
  selector: 'app-positions-list',
  templateUrl: './list.component.html',
  styles: []
})
export class PositionListComponent implements OnInit {
  companyArray: List[] = [];
  // 单位id
  companyId:number = null;

  list: any[] = [];
  listOfData:any[] = [];
  loading: boolean = false;
  constructor(
    private modalService: NzModalService,
    private commonFn: CommonFunctionService,
    private msg: NzMessageService,
    private settingsConfigService: SettingsConfigService
  ) {
    this.settingsConfigService.get('/api/company/user/all').subscribe((res:ApiData) => {
      if(res.code === 200) {
        let data:any[] = res.data.company;
        this.companyArray = data.map( v => {
          return { id: v.id, name: v.name };
        });
      }
    })
  }

  ngOnInit() {

  }

  add() :void {
    this.createComponentModal();
  }

  edit(data:any): void {
    console.log('data', data);
    this.createComponentModal(data);
  }

  createComponentModal(data:any = null): void {
    console.log(data);
    const modal = this.modalService.create({
      nzTitle: (!data ? '新增' : '编辑') + '职位',
      nzContent: PositionFormComponent,
      nzWrapClassName: 'modal-lg',
      nzMaskClosable: false,
      nzComponentParams: {
        companyId: this.companyId,
        COMPANY: this.companyArray,
        data: data
      },
      nzFooter: null
    });

    // modal.afterOpen.subscribe(() => console.log('[afterOpen] emitted!'));

    // Return a result when closed
    modal.afterClose.subscribe(result => {
      if(result) {
        this.getDataList();
      }
    });

  }
  
  disabled(id:number):void {
    this.settingsConfigService.post('/api/position/disable', { position_ids: [id] })
        .subscribe((res:ApiData) => {
          if(res.code === 200) {
            this.msg.success('禁用成功');
            this.listOfData = this.listOfData.filter( v => v.id !== id);
            this.list = this.list.map( v => {
              if(v.id === id ) v.active = false;
              return v;
            });
          }else {
            this.msg.error(res.error || '禁用失败')
          }
    });
  }
  enabled(id:number):void {
    this.settingsConfigService.post('/api/position/enable', { position_ids: [id] })
        .subscribe((res:ApiData) => {
          if(res.code === 200) {
            this.msg.success('启用成功');
            this.listOfData = this.listOfData.filter( v => v.id !== id);
            this.list = this.list.map( v => {
              if(v.id === id ) v.active = true;
              return v;
            });
          }else {
            this.msg.error(res.error || '启用失败')
          }
    })
  }


  // 搜索条件发生变化
  searchOptionsChange(option?:any) {
    if(this.list.length !== 0) {
      let object:any = {};
      for (const key in option) {
        if (option.hasOwnProperty(key)) {
          const element = option[key];
          if(key !== 'company_id') {
            object[key] = element;
          }
        }
      }
      this.listOfData = this.commonFn.filterListOfData(this.list, object);
    }
  }
  // 单位筛选发生变化
  companyValueChange({company_id}):void {
    this.companyId = company_id;
    this.listOfData = this.list = [];
    this.getDataList(company_id);
  }
  getDataList(id:number = this.companyId) { // 获取单位下的数据
    this.loading = true;
    this.settingsConfigService.post(`/api/position/list`, { company_id: id }).subscribe((res:ApiData) => {
      this.loading = false;
      if(res.code === 200) {
        let data:any[] = res.data.position;
        this.list = data.sort((a:any, b:any) => a.sequence - b.sequence);
        this.searchOptionsChange();
      }
    });
  }

  cancel() {}
}
