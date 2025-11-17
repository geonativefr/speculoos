# Clone API Reference

The Clone module provides advanced object cloning functionality that preserves prototypes, handles circular references, and supports deep or shallow cloning with custom clone hooks.

## Overview

The Clone module includes:
- **clone()**: Main cloning function with circular reference handling
- **Prototype Preservation**: Maintains object prototypes during cloning
- **Circular Reference Handling**: Prevents infinite loops during deep cloning
- **Custom Clone Hooks**: Support for object-specific cloning logic

## Core API

### clone(original, deep?, duplicates?)

Creates a clone of an object with advanced features.

```javascript
import { clone } from 'speculoos';

const original = {
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
    country: 'USA'
  }
};

// Deep clone (default)
const deepClone = clone(original);

// Shallow clone
const shallowClone = clone(original, false);

// Clone with custom duplicates tracking
const duplicates = [];
const trackedClone = clone(original, true, duplicates);
```

**Parameters:**
- `original` (Any): Object or value to clone
- `deep` (Boolean, default: true): Whether to perform deep cloning
- `duplicates` (Array, optional): Array to track duplicate references

**Returns:**
- `Any`: Cloned object or value

## Advanced Features

### 1. Prototype Preservation

The clone function preserves the original object's prototype chain:

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return `Hello, I'm ${this.name}`;
  }
}

const john = new Person('John');
const clonedJohn = clone(john);

console.log(clonedJohn instanceof Person); // true
console.log(clonedJohn.greet()); // "Hello, I'm John"
```

### 2. Circular Reference Handling

Handles circular references without infinite loops:

```javascript
const circular = {
  name: 'Parent',
  child: null
};

circular.child = circular; // Create circular reference

const clonedCircular = clone(circular);
console.log(clonedCircular.child === clonedCircular); // true (same object)
console.log(clonedCircular.child.name); // "Parent"
```

### 3. Array Handling

Special handling for arrays while preserving array prototype:

```javascript
const originalArray = ['item1', 'item2', 'item3'];
const clonedArray = clone(originalArray);

console.log(Array.isArray(clonedArray)); // true
console.log(clonedArray.length); // 3
console.log(clonedArray[0]); // 'item1'
```

### 4. Custom Clone Hooks

Objects with `__clone` method can customize cloning behavior:

```javascript
class CustomCloneable {
  constructor(data) {
    this.data = data;
    this.clonedAt = null;
  }
  
  __clone() {
    this.clonedAt = new Date().toISOString();
    console.log(`Object cloned at ${this.clonedAt}`);
  }
  
  getInfo() {
    return {
      data: this.data,
      clonedAt: this.clonedAt
    };
  }
}

const original = new CustomCloneable({ message: 'test' });
const cloned = clone(original);

console.log(cloned.getInfo().clonedAt); // Timestamp when cloned
console.log(cloned instanceof CustomCloneable); // true
```

## Usage Patterns

### 1. Basic Cloning

Simple object cloning with different depths:

```javascript
import { clone } from 'speculoos';

const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  profile: {
    bio: 'Software developer',
    avatar: 'avatar.jpg'
  }
};

// Deep clone (default)
const deepClonedUser = clone(user);
deepClonedUser.profile.bio = 'Updated bio';
// Original user is not affected

// Shallow clone
const shallowClonedUser = clone(user, false);
shallowClonedUser.profile.bio = 'Updated bio';
// Original user.profile.bio is also affected (same reference)
```

### 2. Nested Object Cloning

Complex nested structures with circular references:

```javascript
const company = {
  name: 'Tech Corp',
  employees: [
    {
      name: 'Alice',
      manager: null
    },
    {
      name: 'Bob',
      manager: null
    }
  ]
};

// Create circular reference
company.employees[0].manager = company.employees[1];
company.employees[1].manager = company.employees[0];

const clonedCompany = clone(company);
console.log(clonedCompany.employees[0].manager === clonedCompany.employees[1]); // true
console.log(clonedCompany.employees[1].manager === clonedCompany.employees[0]); // true
```

### 3. Class Instance Cloning

Cloning class instances with method preservation:

```javascript
class Book {
  constructor(title, author) {
    this.title = title;
    this.author = author;
    this.chapters = [];
  }
  
  addChapter(title) {
    this.chapters.push(title);
  }
  
  getChapterCount() {
    return this.chapters.length;
  }
}

const book = new Book('JavaScript Guide', 'John Doe');
book.addChapter('Introduction');
book.addChapter('Basics');

const clonedBook = clone(book);
console.log(clonedBook instanceof Book); // true
console.log(clonedBook.getChapterCount()); // 2
clonedBook.addChapter('Advanced');
console.log(book.getChapterCount()); // 2 (original unchanged)
```

### 4. Selective Property Cloning

Clone only specific properties of an object:

```javascript
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',
  profile: {
    bio: 'Developer',
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
};

// Clone without sensitive data
const safeClone = clone(user);
delete safeClone.password;
delete safeClone.profile.settings.notifications;

// Or clone only specific properties
const partialClone = (() => {
  const original = { id: user.id, name: user.name };
  return clone(original);
})();
```

### 5. Date and Function Handling

Special handling for different data types:

```javascript
const complex = {
  date: new Date('2023-01-01'),
  regex: /test/g,
  func: () => 'Hello World',
  error: new Error('Test error'),
  symbol: Symbol('test')
};

const cloned = clone(complex);

console.log(cloned.date instanceof Date); // true
console.log(cloned.func === cloned.func); // false (new function)
console.log(cloned.error instanceof Error); // false (new error)
console.log(cloned.symbol === cloned.symbol); // false (new symbol)
```

## Advanced Usage

### 1. Custom Clone Strategy

Implement custom cloning logic for specific use cases:

```javascript
class SmartCloner {
  constructor(options = {}) {
    this.options = {
      deep: true,
      preserveUndefined: false,
      cloneFunctions: false,
      maxDepth: 10,
      ...options
    };
  }
  
  clone(original) {
    return this.cloneWithDepth(original, 0);
  }
  
  cloneWithDepth(original, depth) {
    // Check max depth
    if (depth >= this.options.maxDepth) {
      return this.handleMaxDepth(original);
    }
    
    // Handle different types
    if (original === null || typeof original !== 'object') {
      return this.clonePrimitive(original);
    }
    
    // Handle arrays
    if (Array.isArray(original)) {
      return this.cloneArray(original, depth);
    }
    
    // Handle dates
    if (original instanceof Date) {
      return new Date(original.getTime());
    }
    
    // Handle functions
    if (typeof original === 'function') {
      return this.options.cloneFunctions ? original : undefined;
    }
    
    // Handle regular objects
    return this.cloneObject(original, depth);
  }
  
  cloneObject(original, depth) {
    // Create clone with same prototype
    const cloned = Object.create(Object.getPrototypeOf(original));
    
    // Copy properties
    for (const key in original) {
      if (original.hasOwnProperty(key)) {
        const value = original[key];
        
        // Handle undefined values
        if (value === undefined && !this.options.preserveUndefined) {
          continue;
        }
        
        cloned[key] = this.cloneWithDepth(value, depth + 1);
      }
    }
    
    // Call __clone hook if exists
    if (typeof cloned.__clone === 'function') {
      cloned.__clone();
    }
    
    return cloned;
  }
  
  cloneArray(original, depth) {
    const cloned = [];
    
    for (let i = 0; i < original.length; i++) {
      cloned[i] = this.cloneWithDepth(original[i], depth + 1);
    }
    
    return cloned;
  }
  
  clonePrimitive(original) {
    // Primitives are returned as-is
    return original;
  }
  
  handleMaxDepth(original) {
    if (this.options.onMaxDepth) {
      return this.options.onMaxDepth(original);
    }
    
    // Return reference to avoid data loss
    return original;
  }
}

// Usage
const smartCloner = new SmartCloner({
  maxDepth: 5,
  cloneFunctions: true,
  onMaxDepth: (obj) => console.warn('Max depth reached for:', obj)
});

const cloned = smartCloner.clone(complexObject);
```

### 2. Immutable Update Pattern

Create immutable updates using cloning:

```javascript
class ImmutableState {
  constructor(initialState) {
    this.state = clone(initialState);
  }
  
  update(updates) {
    const newState = clone(this.state);
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        newState[key] = updates[key];
      }
    });
    
    this.state = newState;
    return newState;
  }
  
  getState() {
    return clone(this.state); // Return copy to prevent external mutation
  }
  
  updateProperty(key, value) {
    return this.update({ [key]: value });
  }
}

const state = new ImmutableState({ count: 0, name: 'test' });
const updatedState = state.update({ count: 1 });
console.log(state.getState().count); // 1
console.log(updatedState.count); // 1
```

### 3. Performance Monitoring

Monitor cloning performance and optimize:

```javascript
class PerformanceCloner {
  constructor() {
    this.stats = {
      totalClones: 0,
      totalTime: 0,
      averageTime: 0
    };
  }
  
  clone(original) {
    const startTime = performance.now();
    
    try {
      const result = this.performClone(original);
      
      // Update stats
      const endTime = performance.now();
      const cloneTime = endTime - startTime;
      
      this.stats.totalClones++;
      this.stats.totalTime += cloneTime;
      this.stats.averageTime = this.stats.totalTime / this.stats.totalClones;
      
      return result;
    } catch (error) {
      console.error('Clone failed:', error);
      throw error;
    }
  }
  
  performClone(original) {
    // Use native structured cloning for simple objects
    if (this.isSimpleObject(original)) {
      return structuredClone(original);
    }
    
    // Use custom cloning for complex objects
    return this.customClone(original);
  }
  
  isSimpleObject(obj) {
    return obj !== null && 
           typeof obj === 'object' && 
           !Array.isArray(obj) &&
           Object.getPrototypeOf(obj) === Object.prototype;
  }
  
  customClone(original) {
    // Implementation of custom cloning logic
    return clone(original);
  }
  
  getStats() {
    return { ...this.stats };
  }
}

const perfCloner = new PerformanceCloner();
const cloned = perfCloner.clone(largeObject);
console.log(perfCloner.getStats());
```

### 4. Type-Safe Cloning

Create type-aware cloning with validation:

```javascript
class TypeSafeCloner {
  constructor() {
    this.typeHandlers = new Map();
  }
  
  registerType(type, handler) {
    this.typeHandlers.set(type, handler);
  }
  
  clone(original) {
    const type = this.detectType(original);
    const handler = this.typeHandlers.get(type);
    
    if (handler) {
      return handler(original);
    }
    
    // Default cloning
    return this.defaultClone(original);
  }
  
  detectType(obj) {
    if (obj === null) return 'null';
    if (Array.isArray(obj)) return 'array';
    if (obj instanceof Date) return 'date';
    if (obj instanceof RegExp) return 'regexp';
    if (typeof obj === 'function') return 'function';
    if (typeof obj === 'object') return 'object';
    return 'primitive';
  }
  
  defaultClone(original) {
    const type = this.detectType(original);
    
    switch (type) {
      case 'array':
        return original.map(item => this.clone(item));
      case 'date':
        return new Date(original.getTime());
      case 'regexp':
        return new RegExp(original.source, original.flags);
      case 'function':
        return original.bind({});
      default:
        return this.cloneObject(original);
    }
  }
  
  cloneObject(obj) {
    const cloned = Object.create(Object.getPrototypeOf(obj));
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.clone(obj[key]);
      }
    }
    
    return cloned;
  }
}

// Usage
const typeSafeCloner = new TypeSafeCloner();

// Register custom handlers
typeSafeCloner.registerType('custom', (obj) => {
  return obj.clone(); // Use object's own clone method
});

const cloned = typeSafeCloner.clone(customObject);
```

## Performance Considerations

### 1. Deep vs Shallow Cloning

Choose appropriate cloning depth:

```javascript
// Use shallow cloning for performance when you don't need deep copies
const shallowClone = clone(largeArray, false);

// Use deep cloning when you need independent copies
const deepClone = clone(complexObject, true);

// Consider using structuredClone for modern browsers
const modernClone = structuredClone(object); // Native, faster
```

### 2. Memory Management

Manage memory efficiently with large objects:

```javascript
class MemoryEfficientCloner {
  constructor() {
    this.objectPool = new Map();
    this.maxPoolSize = 100;
  }
  
  clone(original) {
    // Check if we can reuse from pool
    const pooled = this.getFromPool(original);
    if (pooled) {
      return pooled;
    }
    
    // Create new clone
    const cloned = this.performClone(original);
    
    // Add to pool if space available
    this.addToPool(cloned);
    
    return cloned;
  }
  
  getFromPool(original) {
    // Simple pool implementation - in practice, you'd need more sophisticated logic
    return this.objectPool.get(this.getPoolKey(original));
  }
  
  addToPool(cloned) {
    if (this.objectPool.size < this.maxPoolSize) {
      this.objectPool.set(this.getPoolKey(cloned), cloned);
    }
  }
  
  getPoolKey(obj) {
    // Generate key based on object structure
    return JSON.stringify(Object.keys(obj).sort());
  }
}
```

### 3. Circular Reference Optimization

Optimize circular reference handling:

```javascript
class OptimizedCircularCloner {
  constructor() {
    this.seen = new WeakMap();
  }
  
  clone(original) {
    return this.cloneWithCircularCheck(original);
  }
  
  cloneWithCircularCheck(original, seen = new WeakMap()) {
    // Check for circular references
    if (this.seen.has(original)) {
      return this.seen.get(original);
    }
    
    // Mark as seen
    this.seen.set(original, 'circular-reference-placeholder');
    
    const cloned = this.performClone(original);
    
    // Replace circular references
    if (cloned === 'circular-reference-placeholder') {
      this.seen.set(original, this.seen.get(original));
      return this.seen.get(original);
    }
    
    // Update seen map with actual clone
    this.seen.set(original, cloned);
    
    return cloned;
  }
}
```

## Testing

### 1. Basic Cloning Tests

```javascript
import { clone } from 'speculoos';

describe('Clone', () => {
  test('clones primitive values', () => {
    expect(clone(null)).toBeNull();
    expect(clone(42)).toBe(42);
    expect(clone('string')).toBe('string');
    expect(clone(true)).toBe(true);
  });
  
  test('clones arrays', () => {
    const original = [1, 2, 3];
    const cloned = clone(original);
    
    expect(cloned).not.toBe(original); // Different reference
    expect(cloned).toEqual(original); // Same values
    expect(Array.isArray(cloned)).toBe(true);
  });
  
  test('clones objects', () => {
    const original = { a: 1, b: 2 };
    const cloned = clone(original);
    
    expect(cloned).not.toBe(original); // Different reference
    expect(cloned).toEqual(original); // Same values
    expect(cloned.a).toBe(1);
    expect(cloned.b).toBe(2);
  });
  
  test('preserves prototypes', () => {
    class TestClass {
      constructor(value) {
        this.value = value;
      }
      
      getValue() {
        return this.value;
      }
    }
    
    const original = new TestClass('test');
    const cloned = clone(original);
    
    expect(cloned instanceof TestClass).toBe(true);
    expect(cloned.getValue()).toBe('test');
  });
});
```

### 2. Circular Reference Tests

```javascript
describe('Circular Reference Handling', () => {
  test('handles circular objects', () => {
    const circular = { name: 'parent' };
    circular.self = circular;
    
    const cloned = clone(circular);
    
    expect(cloned.self).toBe(cloned);
    expect(cloned.name).toBe('parent');
  });
  
  test('handles complex circular structures', () => {
    const a = { name: 'A' };
    const b = { name: 'B', ref: a };
    a.ref = b;
    
    const cloned = clone(a);
    
    expect(cloned.ref).toBe(cloned.ref.ref);
    expect(cloned.ref.ref).toBe(cloned);
  });
});
```

### 3. Performance Tests

```javascript
describe('Clone Performance', () => {
  test('performance with large objects', () => {
    const largeObject = {
      data: new Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        nested: { value: i, deep: { level: 2 } }
      }))
    };
    
    const startTime = performance.now();
    const cloned = clone(largeObject);
    const endTime = performance.now();
    
    const cloneTime = endTime - startTime;
    
    expect(cloneTime).toBeLessThan(100); // Should complete in reasonable time
    expect(cloned).toEqual(largeObject);
  });
});
```

## Best Practices

### 1. Choosing Clone Strategy

- Use shallow cloning for performance when possible
- Use deep cloning when you need independent copies
- Consider using `structuredClone()` in modern browsers
- Implement custom cloning for special object types

### 2. Memory Management

- Be aware of memory usage with large objects
- Use object pooling for frequently cloned objects
- Clean up circular references when no longer needed
- Monitor cloning performance in production

### 3. Type Safety

- Validate objects before cloning
- Handle special types (Date, RegExp, Function)
- Preserve object prototypes when needed
- Implement proper error handling

### 4. Circular References

- Test with circular structures
- Use WeakMap for tracking seen objects
- Provide meaningful behavior for circular references
- Document circular reference handling in your API

## See Also

- [Core Concepts - Vue 3 Reactivity](../core-concepts/vue3-reactivity.md) - Reactivity patterns
- [API Reference - Store](./store.md) - Store integration
- [API Reference - Hydra](./hydra.md) - Hydra plugin integration