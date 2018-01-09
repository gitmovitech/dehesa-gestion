import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PestanaPagosComponent } from './pestana-pagos.component';

describe('PestanaPagosComponent', () => {
  let component: PestanaPagosComponent;
  let fixture: ComponentFixture<PestanaPagosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PestanaPagosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PestanaPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
