import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TsTreeComponent } from './tstree.component';

describe('TstreeComponent', () => {
  let component: TsTreeComponent;
  let fixture: ComponentFixture<TsTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
