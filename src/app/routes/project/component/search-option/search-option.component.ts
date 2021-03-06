import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { List } from 'src/app/data/interface.data';

@Component({
  selector: 'app-product-search-option',
  templateUrl: './search-option.component.html',
  styleUrls: ['./search-option.component.less']
})
export class ProductSearchOptionComponent implements OnInit {
  validateForm: FormGroup;
  controlArray: Array<{ index: number; show: boolean }> = [];
  isCollapse = true;

  @Input() COMPANY:List[];
  @Input() isAdd:boolean = true;

  @Output() searchOptionsEmit: EventEmitter<any> = new EventEmitter();
  @Output() companyValueChange: EventEmitter<any> = new EventEmitter();
  @Output() addContentEmit: EventEmitter<any> = new EventEmitter();

  company:Array<List> = [];

  constructor(
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      company_id: [ null ], // 单位
      name: [ null ] // 名称
      // active: [ true ] // 是否有效
    });

    // 请求获取 上层数据， 如： 职位事公司下的数据
    setTimeout(() => {
      this.company = this.COMPANY;
    }, 800);

    this.validateForm.get('company_id').valueChanges.subscribe( id => {
      if(id) {
        this.companyChanged(id);
      }
    });
  }

  companyChanged(id:number) {
    /**** 单位发生变化
     *    所有的数据列表都需要发生变化
     *    但是，查询表单里面的active 仍然需要重置为 true
     * *****/
    this.companyValueChange.emit({company_id: id});
    this.validateForm.patchValue({
      name: ''
      // active: true
    });
  }

  submit() {
    let option:any = this.validateForm.value;
    this.searchOptionsEmit.emit(option);
  }

  resetForm(): void {
    this.validateForm.patchValue({
      name: ''
      // active: true
    });
    this.searchOptionsEmit.emit(null)
  }
  /*** 新增列表内容 ***/
  add() {
    this.addContentEmit.emit();
  }

}
