# Hydra forms

## Item form
To create / update items:

```js
import { useStore, useItemForm } from 'speculoos';

const store = useStore();
const book = await store.getItem('/api/books/1');
const form = useItemForm(book);
const {
  item, // Deep clone of the original item - use it for v-models
  isUnsavedDraft, // Whether that clone differs from the original one
  isCreationMode, // Whether the item has an IRI
  isSubmitting, // Whether the API upsert process is in progress
  reset, // Reset all changes
} = form;

const submit = async () => {
  try {
    await form.submit();
    // `book` should now be updated, and `item` too
    // Good place to spawn some success message
  } catch (e) {
    // Handle error
  }
}
```

## Form Validation

HTML5 Custom form validity can be bound from Constraint Violation errors.

```vue
<template>
  <form ref="FormHTMLElement" @submit.prevent="submit">
  <!-- ... -->
  </form>
</template>
<script setup>
import { ref } from 'vue';
import { useStore, useItemForm, useFormValidation, ConstraintViolationList } from 'speculoos';

const store = useStore();
const book = await store.getItem('/api/books/1');
const FormHTMLElement = ref();
const {item} = useItemForm(book);
const {resetValidity, validate, bindViolations} = useFormValidation();

const submit = async () => {
  try {
    resetValidity(FormHTMLElement);
    if (validate(FormHTMLElement)) { // Can pre-check required / patterned fields
      await form.submit();
    }
  } catch (error) {
    if (e instanceof ConstraintViolationList) {
        bindViolations(FormHTMLElement, error); // Will bind violations to the appropriate inputs (propertyPath -> input name)
    }
  }
}
</script>
```
