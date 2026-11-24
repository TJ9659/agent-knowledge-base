import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyArticles } from './my-articles';

describe('MyArticles', () => {
  let component: MyArticles;
  let fixture: ComponentFixture<MyArticles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyArticles],
    }).compileComponents();

    fixture = TestBed.createComponent(MyArticles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
