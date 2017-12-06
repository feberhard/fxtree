import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FxTreeComponent } from './fxtree.component';

describe('FxtreeComponent', () => {
  let component: FxTreeComponent;
  let fixture: ComponentFixture<FxTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FxTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FxTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
