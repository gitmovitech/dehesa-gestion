import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspendidosComponent } from './suspendidos.component';

describe('SuspendidosComponent', () => {
  let component: SuspendidosComponent;
  let fixture: ComponentFixture<SuspendidosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuspendidosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuspendidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
