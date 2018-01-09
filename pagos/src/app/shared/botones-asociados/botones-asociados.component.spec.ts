import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonesAsociadosComponent } from './botones-asociados.component';

describe('BotonesAsociadosComponent', () => {
  let component: BotonesAsociadosComponent;
  let fixture: ComponentFixture<BotonesAsociadosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BotonesAsociadosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BotonesAsociadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
