export function createPager({itemsPerPage, currentPage, totalItems}) {
  if (null == totalItems) {
    return new PartialPager({itemsPerPage, currentPage});
  }
  return new StandardPager({itemsPerPage, currentPage, totalItems});
}

function generatePages(lastPage) {
  return Array.from({length: lastPage}, (_, i) => i + 1);
}

class Pager {
  itemsPerPage;
  totalItems;
  currentPage;
  previousPage;
  nextPage;
  lastPage;
  offset;
  _pages;

  get pages() {
    if (undefined === this._pages) {
      this._pages = generatePages(this.lastPage);
    }

    return this._pages;
  }

  constructor({itemsPerPage, currentPage}) {
    this.itemsPerPage = parseInt(itemsPerPage);
    this.currentPage = parseInt(currentPage);
    this.offset = Math.max(0, (currentPage * itemsPerPage) - itemsPerPage);
    this.previousPage = Math.max(1, this.currentPage - 1);
  }

  isPartial() {
    return null == this.totalItems;
  }

  isFirstPage(page = undefined) {
    return parseInt(page ?? this.currentPage) === 1;
  }

  isPreviousPage(page) {
    return parseInt(page) === this.previousPage;
  }

  isCurrentPage(page) {
    return parseInt(page) === this.currentPage;
  }

  isNextPage(page) {
    return parseInt(page) === this.nextPage;
  }

  isLastPage(page = undefined) {
    return parseInt(page ?? this.currentPage) === this.lastPage;
  }

  *[Symbol.iterator]() {
    yield* this.pages;
  }

  truncate(delta, includeEdges = false) {
    return new TruncatedPager(this, delta, includeEdges);
  }
}

class StandardPager extends Pager {
  constructor({itemsPerPage, currentPage, totalItems}) {
    super({itemsPerPage, currentPage});
    this.totalItems = parseInt(totalItems);
    this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage)));
    this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}

class PartialPager extends Pager {
  constructor({itemsPerPage, currentPage, totalItems}) {
    super({itemsPerPage, currentPage, totalItems});
    this.nextPage = this.lastPage = this.currentPage + 1;
  }
}

class TruncatedPager extends Pager {
  constructor(pager, delta, includeEdges = false) {
    super(pager);
    Object.assign(this, pager);
    const pages = [];
    if (includeEdges) {
      pages.push(1);
    }
    for (let page = 1; page <= this.lastPage; page++) {
      if (page === this.currentPage) {
        pages.push(page);
      }
      if (page < this.currentPage && page >= (this.currentPage - delta)) {
        pages.push(page);
      }
      if (page > this.currentPage && page <= (this.currentPage + delta)) {
        pages.push(page);
      }
    }
    if (includeEdges) {
      pages.push(this.lastPage);
    }

    this._pages = [...new Set(pages)];
  }
}
