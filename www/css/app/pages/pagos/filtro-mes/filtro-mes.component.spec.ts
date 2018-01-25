import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroMesComponent } from './filtro-mes.component';

describe('FiltroMesComponent', () => {
  let component: FiltroMesComponent;
  let fixture: ComponentFixture<FiltroMesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FiltroMesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FiltroMesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
