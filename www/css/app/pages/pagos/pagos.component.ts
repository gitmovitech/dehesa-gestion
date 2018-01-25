import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    $('#modalcomentarios').on('shown.bs.modal', function () {
      $('#myInput').trigger('focus')
    })
  }

}
