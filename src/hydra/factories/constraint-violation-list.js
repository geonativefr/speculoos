import { HydraError } from './hydra-error.js';
import { v4 as uuid } from 'uuid';
import empty from 'is-empty';

export class Violation {
  id;
  propertyPath;
  message;
  code;
  constructor() {
    this.id = uuid();
  }
}

export class ConstraintViolationList extends HydraError {
  _violations = [];
  constructor(data) {
    super();
    Object.assign(
      this,
      {
        * [Symbol.iterator]() {
          yield* this.violations;
        },
      }
    );
    Object.assign(this, data);
  }

  /**
   * @returns Array<Violation>
   */
  get violations() {
    return this._violations;
  }

  set violations(violations) {
    this._violations = violations.map(violation => Object.assign(new Violation(), violation));
  }

  getPropertyPaths() {
    return [...new Set(this.violations.map(({propertyPath}) => propertyPath))];
  }

  getViolations(propertyPath) {
    const propertyPaths = Array.from(arguments);
    if (0 === propertyPaths.length) {
      return this.violations;
    }
    if (empty(propertyPaths[0])) {
      return this.violations.filter(violation => empty(violation.propertyPath));
    }
    return this.violations.filter(violation => propertyPath === violation.propertyPath);
  }
}
