import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';

describe('CuentasPorCobrarComponent', () => {
  let component: CuentasPorCobrarComponent;
  let fixture: ComponentFixture<CuentasPorCobrarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CuentasPorCobrarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CuentasPorCobrarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
