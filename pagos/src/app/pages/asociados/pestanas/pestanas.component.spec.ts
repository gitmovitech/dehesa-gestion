import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PestanasComponent } from './pestanas.component';

describe('PestanasComponent', () => {
  let component: PestanasComponent;
  let fixture: ComponentFixture<PestanasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PestanasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PestanasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
