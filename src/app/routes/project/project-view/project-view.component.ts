import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { _HttpClient, SettingsService } from '@delon/theme';
import { SettingsConfigService } from '../../service/settings-config.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiData } from 'src/app/data/interface.data';

// html ===> pdf
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-project-view',
  templateUrl: './project-view.component.html',
  styleUrls: ['./project-view.component.less']
})
export class ProjectViewComponent implements OnInit {
  projectId:number = null;
  project:any = {
    info: null,
    budget: null
  };

  showContractExpand:{ [key: string]: boolean } = {}; // 供应商 合约展示
  showNoContractExpand:{ [key: string]: boolean } = {}; // 供应商 合约展示
  

  constructor(
    public msg: NzMessageService,
    public notice: NzNotificationService,
    private settings: SettingsService,
    private settingsConfigService: SettingsConfigService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.params.subscribe((params:Params) => {
      if(params && params['id']) {
        this.projectId = +params['id'];
        this.getDataInfo(params['id']);
      }
    })
  }

  ngOnInit() {

  }

  // 打印
  printCurrentModal(idname:string, title: string) {
    let printWindow = window.open();

    html2canvas(document.querySelector(`#${idname}`)).then(canvas => {
      let compress = document.createElement('canvas');

      // change the image size

      compress.width = canvas.width;

      compress.height = canvas.height;

      const imageStr = canvas.toDataURL("image/png");

      let image = new Image();

      image.src = imageStr;

      image.onload = function () {

        compress.getContext("2d").drawImage(image, 0, 0, compress.width, compress.height);

        const imgString = compress.toDataURL("image/png");

        // const iframe = '<iframe src="' + imageStr + '" frameborder="0" style="border:0;" allowfullscreen></iframe>'
        const head:string = document.querySelector('head').innerHTML;;
        const style:string = `<style>body {-webkit-print-color-adjust: exact; padding: 12px!important;}</style>`;
        const div:string = '<div>' + '<img src="' + imgString + '" />' +'</div>';
    
        const docStr = head + style + div;

        printWindow.document.write(docStr);

        printWindow.document.close();

        printWindow.onload = function () {

          printWindow.print();
          printWindow.close();

        };

      }

    });
  }

  isPrinter:boolean = false;
  // pdf
  downloadFile(type:string) {
    this.isPrinter = true;
    setTimeout(() => {
      const data:any = document.getElementById('print-box');
      html2canvas(data).then(canvas => {
        this.isPrinter = false;
        // Few necessary setting options  
        const imgWidth:number = 208;
        const imgHeight:number = canvas.height * imgWidth / canvas.width;
        console.log(canvas, imgWidth, imgHeight); 
        const pageHeight:number = 295;
        const leftHeight:number = imgHeight;
    
        const contentDataURL = canvas.toDataURL('image/png', 1.0)
        if(type === 'pdf') {
          this.exportPdf(contentDataURL, imgWidth, imgHeight, pageHeight, leftHeight);
        }
        if(type === 'image') {
          this.exportImage(contentDataURL);
        }
        
      });
    }, 500);
    
  }
  pdfPosition:number = 0;
  exportPdf(contentDataURL:any, imgWidth:number, imgHeight:number, pageHeight:number, leftHeight:number) {
    // let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF  
    // const position:number = 0;
    // pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
    // const pdf_name:string = this.project.info.name + "_" + (new Date().getTime()) + '.pdf';
    // pdf.save(pdf_name); // Generated PDF 

    let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF  
    if (leftHeight + 10 < pageHeight) {
      pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight)
    } else {
        while (leftHeight > 0) {
          pdf.addImage(contentDataURL, 'PNG', 0, this.pdfPosition, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          this.pdfPosition -= 295;
            // 避免添加空白页
            if (leftHeight > 0) {
                pdf.addPage()
            }
        }
    }
    
    const pdf_name:string = this.project.info.name + "_" + (new Date().getTime()) + '.pdf';
    pdf.save(pdf_name); // Generated PDF 
  }
  // TODO: 图片和 pdf 下载 功能
  exportImage(contentDataURL:any) {
      var base64Img = contentDataURL;
      let oA:any = document.createElement('a');
      oA.href = base64Img;
      oA.download = this.project.info.name + "_" + (new Date().getTime());
      var event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      oA.dispatchEvent(event);
  }


  getDataInfo(id:number):void {
    this.settingsConfigService.get(`/api/project/detail/${id}`).subscribe((res:ApiData) => {
      if(res.code === 200) {
        this.project['info'] = res.data;
        this.getDataList(); // 获取项目下所有相关信息数据
        if(!res.data.draft) { // 非草稿时 获取流程  获取项目操作日志
          this.getWorkflow(res.data.id);
          this.getProjectLog(this.projectId);
        }
      }
    })
  }

  getDataList() { // 获取项目下所有相关信息数据
    const id:number = this.project.info.id;
    this.getBudgetInfo(id);
    this.getContractAndTreatyList(id);
    this.getIncomeList(id);
  }

  logLoading:boolean = true;
  logs:any[] = [];
  getProjectLog(id:number):void {
    this.settingsConfigService.get(`/api/project/log/${id}`).subscribe((res:ApiData) => {
      console.log('log ....', res.data);
      this.logLoading = false;
      if(res.code === 200) {
        this.logs = res.data.project_log;
      }else {
        this.logs = [];
      }
    })
  }

  getBudgetInfo(proId:number):void {
    this.settingsConfigService.get(`/api/budget/project/${proId}`).subscribe((res:ApiData) => {
      if(res.code === 200) {
        const budget:any = res.data;
        this.settingsConfigService.get(`/api/cost/budget/${res.data.id}`).subscribe((costRes:ApiData) => {
          if(costRes.code === 200) {
            this.project.budget = Object.assign(budget, { cost: costRes.data.cost });
            console.log(this.project);
            // this.transferAmount(this.project.budget.income)
          }
        })
      }
    })
  }

  proIncomeList:any[] = [];
  subIncomeList:any[] = [];
  getIncomeList(proId:number) {
    // 获取项目收入
    this.settingsConfigService.get(`/api/project/revenue/${proId}`).subscribe((res:ApiData) => {
      // console.log('项目收入', res);
      if(res.code === 200) {
        this.proIncomeList = res.data.project_revenue;
      }
    });
    // 获取补贴收入
    this.settingsConfigService.get(`/api/subsidy/income/${proId}`).subscribe((res:ApiData) => {
      // console.log('补贴收入', res);
      if(res.code === 200) {
        this.subIncomeList = res.data.subsidy_income;
      }
    });
  }
  
  contractList:any[] = []; // 项目下的合约列表
  treatyList:any[] = []; // 项目下的非合约列表
  getContractAndTreatyList(proId:number):void {
    this.settingsConfigService.get(`/api/deal/project/${proId}`).subscribe((res:ApiData) => {
      console.log('项目下的所有 合约 列表', res);
      if(res.code === 200) {
        this.contractList = res.data.deal;
      }
    })
    this.settingsConfigService.get(`/api/treaty/${proId}`).subscribe((res:ApiData) => {
      console.log('项目下的所有 非合约 列表', res);
      if(res.code === 200) {
        this.treatyList = res.data.treaty;
      }
    })
  }

  showContract(id:number):void { // 切换供应商合约展示 与否 ？
    this.showContractExpand[id] = !this.showContractExpand[id];
  }
  showNoContract(id:number):void { // 切换供应商合约展示 与否 ？
    this.showNoContractExpand[id] = !this.showNoContractExpand[id];
  }

  cancel(): void {}

  submitProject(): void {
    this.settingsConfigService
        .post('/api/project/submit', { project_id: this.projectId })
        .subscribe((res:ApiData) => {
          if(res.code === 200) {
            this.msg.success('项目已提交');
            this.router.navigateByUrl('/project/list/progress');
          }else {
            this.msg.error(res.error || '提交失败，请重试');
          }
    })
  }

  // 金额大写
  transferNumber:string = '';
  transferAmount(num:number) {
    this.settingsConfigService.post(`/api/finance/transfer`, { num }).subscribe((res: ApiData) => {
      if (res.code === 200) {
        this.transferNumber = res.data.number;
      }
    });
  }

  // 流程进程信息
  progressInfo:any = null;
  nodeProcess:any[] = [];
  currentNodeProcess:any = null;
  isCurrentCheck:boolean = false;

  checkOption: any = {
    agree: null,
    remark: ''
  }

  getWorkflow(id:number) {
    this.settingsConfigService
        .get(`/api/process/submit/${id}`)
        .subscribe((res:ApiData) => {
          console.log(res, 'workflow');
          if(res.code === 200) {
            this.progressInfo = res.data;
            this.getNodeProcess();
          }
    })
  }

  getNodeProcess():void {
    this.isCurrentCheck = false;
    this.settingsConfigService
        .get(`/api/node/process/${this.progressInfo.id}`)
        .subscribe((res:ApiData) => {
          console.log(res, 'node_process');
          if(res.code === 200) {
            this.nodeProcess = res.data.node_process;
            this.currentNodeProcess = this.nodeProcess.filter( v => v.current)[0];
            console.log(this.currentNodeProcess, this.isCurrentCheck, this.settings.user);
            if(this.currentNodeProcess) {
              this.isCurrentCheck = this.currentNodeProcess.user.id === this.settings.user.id;
            }
          }
    })
  }

  submitCheckCurrentProcess() {
    if(this.checkOption.agree === null) {
      this.notice.error('错误', '是否通过未选择');
      return;
    }
    console.log(this.checkOption, 'agree info submit!');
    const obj:any = {
      ...this.checkOption,
      node_process_id: this.currentNodeProcess.id
    }
    this.settingsConfigService
        .post(`/api/node/process/submit/approval`, obj)
        .subscribe((res:ApiData) => {
          console.log(res, 'approval');
          if(res.code === 200) {
           this.msg.success('审核提交成功');
           this.getWorkflow(this.projectId);
           // 刷新任务栏  日志信息
           this.settingsConfigService.resetGlobalTasks();
           this.getProjectLog(this.projectId);
          }
    })
  }

  // 避免精度丢失
  countPercent(num:number, x:number): number {
    return Math.round(num * x);
  }

}
