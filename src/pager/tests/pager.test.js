import { createPager } from '../pager.js';

it('is partial or not', () => {
  expect(createPager({itemsPerPage: 10}).isPartial()).toBeTruthy();
  expect(createPager({itemsPerPage: 10, totalItems: null}).isPartial()).toBeTruthy();
  expect(createPager({itemsPerPage: 10, totalItems: undefined}).isPartial()).toBeTruthy();
  expect(createPager({itemsPerPage: 10, totalItems: 30}).isPartial()).toBeFalsy();
});

it('returns a standard pager', () => {
  const pager = createPager({itemsPerPage: 10, totalItems: 32, currentPage: 3});
  expect(pager.currentPage).toEqual(3);
  expect(pager.nextPage).toEqual(4);
  expect(pager.lastPage).toEqual(4);
  expect(pager.previousPage).toEqual(2);
  expect(pager.offset).toEqual(20);

  expect(pager.isCurrentPage(3)).toBeTruthy();
  expect(pager.isNextPage(4)).toBeTruthy();
  expect(pager.isLastPage(4)).toBeTruthy();
  expect(pager.isPreviousPage(2)).toBeTruthy();
  expect(pager.isFirstPage(1)).toBeTruthy();
});

it('returns a partial pager', () => {
  const pager = createPager({itemsPerPage: 10, currentPage: 3});
  expect(pager.currentPage).toEqual(3);
  expect(pager.nextPage).toEqual(4);
  expect(pager.lastPage).toEqual(4);
  expect(pager.previousPage).toEqual(2);
  expect(pager.offset).toEqual(20);

  expect(pager.isCurrentPage(3)).toBeTruthy();
  expect(pager.isNextPage(4)).toBeTruthy();
  expect(pager.isLastPage(4)).toBeTruthy();
  expect(pager.isLastPage()).toBeFalsy();
  expect(pager.isPreviousPage(2)).toBeTruthy();
  expect(pager.isFirstPage(1)).toBeTruthy();
  expect(pager.isFirstPage()).toBeFalsy();
});

it('returns a truncated pager', () => {
  let pager;
  pager = createPager({itemsPerPage: 10, currentPage: 5, totalItems: 100}).truncate(2);
  expect(pager.pages).toEqual([3, 4, 5, 6, 7]);
  pager = createPager({itemsPerPage: 10, currentPage: 5, totalItems: 100}).truncate(2, true);
  expect(pager.pages).toEqual([1, 3, 4, 5, 6, 7, 10]);
  pager = createPager({itemsPerPage: 10, currentPage: 10, totalItems: 100}).truncate(2, true);
  expect(pager.pages).toEqual([1, 8, 9, 10]);
});

test('isFirstPage() and isLastPage() can take no argument', () => {
  let pager;
  pager = createPager({itemsPerPage: 10, totalItems: 30, currentPage: 3});
  expect(pager.isFirstPage()).toBeFalsy();
  expect(pager.isLastPage()).toBeTruthy();
  pager = createPager({itemsPerPage: 10, totalItems: 30, currentPage: 1});
  expect(pager.isFirstPage()).toBeTruthy();
  expect(pager.isLastPage()).toBeFalsy();

});
