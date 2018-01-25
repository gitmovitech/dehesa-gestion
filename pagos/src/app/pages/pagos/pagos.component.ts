import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {

  constructor() { }

  showContent: boolean;
  years: any;

  ngOnInit() {
    this.showContent = false;
    this.years = [];
    for (let n = 2017; n <= new Date().getFullYear(); n++) {
      this.years.push(n);
    }
    this.years = this.years.reverse();
    $('#modalcomentarios').on('shown.bs.modal', function () {
      $('#myInput').trigger('focus');
    });
  }

  filtrar() {
    if ($('#filtro_ano').val() !== '' && $('#filtro_mes').val()) {
      this.showContent = true;
    }
  }

}
