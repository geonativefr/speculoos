import { clone } from '../index.js';

class Book {
  id;
  published;
  name;
  author;
  properties;
  constructor(data) {
    Object.assign(this, data);
  }

  __clone() {
    this.id = undefined;
  }
}
class Author {
  name;
  age;
  active;
  books = [];
  properties = {};
  constructor(data) {
    Object.assign(this, data);
  }
}

it('clones objects', () => {
  let clonedBook;
  const book = new Book({name: 'I am POTUS', id: 1, published: true});
  const author = new Author({name: 'Donald Trump', age: 75, active: false, properties: {country: 'USA'}});
  book.author = author;
  author.books.push(book);

  clonedBook = clone(book, false);
  expect(clonedBook).toBeInstanceOf(Book);
  expect(clonedBook).not.toBe(book);
  expect(clonedBook.id).toBeUndefined();
  expect(clonedBook.name).toBe(book.name);
  expect(clonedBook.published).toBe(true);
  expect(clonedBook.author).toBe(author);
  expect(clonedBook.properties).toBeUndefined();
  expect(clonedBook.author.properties).toBe(author.properties);
  expect(clonedBook.author.books[0]).toBe(book);

  clonedBook = clone(book, true);
  expect(clonedBook).toBeInstanceOf(Book);
  expect(clonedBook).not.toBe(book);
  expect(clonedBook.id).toBeUndefined();
  expect(clonedBook.name).toBe(book.name);
  expect(clonedBook.published).toBe(true);
  expect(clonedBook.author).toBeInstanceOf(Author);
  expect(clonedBook.author).not.toBe(author);
  expect(clonedBook.author.name).toBe(author.name);
  expect(clonedBook.properties).toBeUndefined();
  expect(clonedBook.author.properties).not.toBe(author.properties);
  expect(clonedBook.author.books[0]).toBe(clonedBook);
});

it('clones arrays', () => {
  const book = new Book({name: 'I am POTUS', id: 1, published: true});
  const collection = [book, book];
  const cloned = clone(collection);

  expect(cloned).toBeInstanceOf(Array);
  expect(cloned[0]).not.toBe(book);
  expect(cloned[1]).not.toBe(book);
  expect(cloned[1]).toBe(cloned[0]); // Generated clones are reused
});

it('doesnt clone unclonable stuff, without complaining', () => {
  expect(clone('foo')).toBe('foo');
  expect(clone(null)).toBe(null);
  expect(clone(undefined)).toBe(undefined);
  expect(clone(42)).toBe(42);
  expect(clone(13.37)).toBe(13.37);
  expect(clone(['foo', null, undefined, 42, 13.37])).toEqual(['foo', null, undefined, 42, 13.37]);
});

it('clones dates, maps, sets and regular expressions', () => {
  class Day extends Date {}
  const author = new Author({name: 'Alice'});
  const orig = {
    at: new Date('2024-01-15T10:00:00Z'),
    day: new Day('2024-01-16T00:00:00Z'),
    authors: new Map([['alice', author]]),
    tags: new Set(['foo', author]),
    pattern: /fo+/gi,
  };
  orig.pattern.lastIndex = 2;
  orig.at.label = 'start';
  const cloned = clone(orig);

  expect(cloned.at).toBeInstanceOf(Date);
  expect(cloned.at).not.toBe(orig.at);
  expect(cloned.at.toISOString()).toBe('2024-01-15T10:00:00.000Z');
  expect(cloned.at.label).toBe('start');
  expect(cloned.day).toBeInstanceOf(Day);
  expect(cloned.day.toISOString()).toBe('2024-01-16T00:00:00.000Z');
  expect(JSON.stringify(cloned)).toBe(JSON.stringify(orig));

  expect(cloned.authors).toBeInstanceOf(Map);
  expect(cloned.authors).not.toBe(orig.authors);
  expect(cloned.authors.get('alice')).toBeInstanceOf(Author);
  expect(cloned.authors.get('alice')).not.toBe(author);
  expect(cloned.authors.get('alice').name).toBe('Alice');

  expect(cloned.tags).toBeInstanceOf(Set);
  expect(cloned.tags).not.toBe(orig.tags);
  expect(cloned.tags.size).toBe(2);
  expect(cloned.tags.has('foo')).toBe(true);
  expect(cloned.tags.has(cloned.authors.get('alice'))).toBe(true); // Generated clones are reused

  expect(cloned.pattern).toBeInstanceOf(RegExp);
  expect(cloned.pattern).not.toBe(orig.pattern);
  expect(cloned.pattern.source).toBe('fo+');
  expect(cloned.pattern.flags).toBe('gi');
  expect(cloned.pattern.lastIndex).toBe(2);
  expect(cloned.pattern.test('afoofoo')).toBe(true);

  const shallow = clone(orig.authors, false);
  expect(shallow).not.toBe(orig.authors);
  expect(shallow.get('alice')).toBe(author);
});

it('clones objects that inherit from dates, maps, sets and regular expressions without being ones', () => {
  [Date, Map, Set, RegExp].forEach(Native => {
    const orig = Object.create(Native.prototype);
    orig.name = 'foo';
    const cloned = clone(orig);

    expect(cloned).not.toBe(orig);
    expect(Object.getPrototypeOf(cloned)).toBe(Native.prototype);
    expect(cloned.name).toBe('foo');
  });
});
