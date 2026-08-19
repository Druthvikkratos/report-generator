import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunList } from './run-list';

describe('RunList', () => {
  let component: RunList;
  let fixture: ComponentFixture<RunList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunList],
    }).compileComponents();

    fixture = TestBed.createComponent(RunList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
