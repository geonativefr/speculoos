# Clone

Utility to clone objects.

## Usage

```js
import { clone } from 'speculoos';

class Book {
  id;
  name;
  properties = {};
  author;

  __clone() {
    this.id = undefined;
  }
}
class Author {
  name;
  books = [];
}

const book = Object.asign(new Book(), {name: 'I am POTUS', id: 1, properties: {isbn: 321651650});
const author = Object.assign(new Author(), {name: 'Donald Trump'});
book.author = author;
author.books.push(book);

const clonedBook = clone(book);
// clonedBook instanceof Book
// clonedBook !== book
// clonedBook.id -> undefined
// clonedBook.name -> 'I am POTUS'
// clonedBook.properties !== book.properties
// clonedBook.properties = {isbn: 321651650}
// clonedBook.author !== author
// clonedBook.author.name = 'Donald Trump'
// clonedBook.author.books = [clonedBook]
```

## Deep cloning

By default, objects are recursively cloned and clones are reused. To prevent this, use `clone(obj, false)`:

```js
const clonedBook = clone(book, false);
// clonedBook instanceof Book
// clonedBook !== book
// clonedBook.id -> undefined
// clonedBook.name -> 'I am POTUS'
// clonedBook.properties === book.properties
// clonedBook.author === author
// clonedBook.author.books = [book]
```

## Additional behavior

As you may have noticed, you can implement `__clone()` inside your clonable objects
so that you can perform post-clone operations, similarly as [PHP](https://www.php.net/manual/fr/language.oop5.cloning.php#object.clone).
