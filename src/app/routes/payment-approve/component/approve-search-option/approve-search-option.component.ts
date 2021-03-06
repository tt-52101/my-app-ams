import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-approve-search-option',
  templateUrl: './approve-search-option.component.html',
  styleUrls: ['./approve-search-option.component.less']
})
export class ApproveSearchOptionComponent implements OnInit {
  validateForm: FormGroup;

  // @Input() COMPANY:List[];

  @Output() searchOptionsEmit: EventEmitter<any> = new EventEmitter();

  // company:Array<List> = [];

  constructor(
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      // company_id: [ null ], // 单位
      name: [ null ] // 名称
    });

  }

  companyChanged(id:number) {
    /**** 单位发生变化
     *    所有的数据列表都需要发生变化
     *    但是，查询表单里面的active 仍然需要重置为 true
     * *****/
    this.validateForm.patchValue({
      name: ''
    });
  }

  submit() {
    let option:any = this.validateForm.value;
    console.log(option);
    this.searchOptionsEmit.emit(option);
  }

  resetForm(): void {
    this.validateForm.patchValue({
      name: ''
    });
    this.searchOptionsEmit.emit(null)
  }

}
