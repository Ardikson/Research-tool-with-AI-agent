import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceMuseum } from './science-museum';

describe('ScienceMuseum', () => {
  let component: ScienceMuseum;
  let fixture: ComponentFixture<ScienceMuseum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceMuseum],
    }).compileComponents();

    fixture = TestBed.createComponent(ScienceMuseum);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
