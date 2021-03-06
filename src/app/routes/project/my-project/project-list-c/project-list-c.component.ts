import { Component, OnInit, Input } from '@angular/core';
import { CommonFunctionService } from 'src/app/routes/service/common-function.service';
import { NzDrawerService, NzMessageService } from 'ng-zorro-antd';
import { ApiData } from 'src/app/data/interface.data';
import { SettingsConfigService } from 'src/app/routes/service/settings-config.service';
import { Router } from '@angular/router';
import { ProjectDrawerSearchOptionComponent } from '../../component/project-drawer-search-option/project-drawer-search-option.component';

@Component({
  selector: 'app-project-list-c',
  templateUrl: './project-list-c.component.html',
  styles: [`
    .search-btn-mobile {
      width: 48px;
      height: 48px;
      line-height: 48px;
      position: fixed;
      right: 0;
      top: 60px;
      z-index: 99;
    }
  `]
})
export class ProjectListCComponent implements OnInit {

  @Input() postUrl:string;
  // 单位id
  companyId: number = null;
  companyArray: any[] = [];

  list: any[] = [];
  listOfData: any[] = [];
  loading: boolean = true;
  searchOption: any = {};

  total = 0;

  pageOption: any = {
    page: 1,
    page_size: 10
  };

  // TODO: checkbox
  constructor(
    private commonFn: CommonFunctionService,
    private settingsConfigService: SettingsConfigService,
    private drawerService: NzDrawerService,
    private router: Router,
    private msg: NzMessageService
  ) {
    this.settingsConfigService.get('/api/company/user/all').subscribe((res: ApiData) => {
      if (res.code === 200) {
        let data: any[] = res.data.company;
        this.companyArray = data.map(v => {
          return { id: v.id, name: v.name };
        });
      }
    })
  }

  ngOnInit() {
    this.getDataList();
  }

  getDataList() { // 获取单位下的数据
    this.loading = true;
    this.settingsConfigService.get(this.postUrl, this.pageOption).subscribe((res: ApiData) => {
      console.log(res);
      this.loading = false;
      if (res.code === 200) {
        const data: any[] = res.data.project;
        this.total = res.data.count;
        this.list = data;
        this.searchOptionsChange();
      }
    });
  }


  view(data: any) {
    this.router.navigateByUrl(`/project/view/${data.id}`);
  }

  change(data:any) {
    // this.router.navigateByUrl(`/project/adjust/${data.id}`);
    this.msg.warning('待开发......')
  }
  // TODO: checkbox

  pageIndexChange($event: number) {
    this.pageOption.page = $event;
    this.getDataList();
  }
  pageSizeChange($event: number) {
    this.pageOption.page_size = $event;
    this.getDataList();
  }

  companyValueChange(id: number) {
    console.log(id, 'company select change!');
  }


  // TODO: checkbox

  // 搜索条件发生变化
  searchOptionsChange(option?: any) {

    if (option) this.searchOption = option;

    option = option || this.searchOption;
    if (this.list.length !== 0) {
      let object: any = {};
      for (const key in option) {
        if (option.hasOwnProperty(key)) {
          const element = option[key];
          if (key === 'code') {
            object['supplier_code'] = element;
          } else {
            object[key] = element;
          }
        }
      }

      this.listOfData = this.commonFn.filterListOfData(this.list, object);
    }
  }

  // 移动端搜索框
  isCollapsed: boolean = false;

  openComponent(): void {
    this.isCollapsed = true;
    const drawerRef = this.drawerService.create<ProjectDrawerSearchOptionComponent, { value: string }, string>({
      nzTitle: '查询',
      nzContent: ProjectDrawerSearchOptionComponent,
      nzContentParams: {
        value: this.searchOption
      }
    });

    // drawerRef.afterOpen.subscribe(() => { });

    drawerRef.afterClose.subscribe(data => {
      this.isCollapsed = false;
      if (data) {
        this.pageOption.page = 1;
        this.searchOptionsChange(data);
      }
    });
  }
}
