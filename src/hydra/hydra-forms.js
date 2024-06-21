import { computed, isRef, reactive, ref, unref, watch } from 'vue';
import { getIri, hasIri } from './iri-functions.js';
import { useStore } from '../store/index.js';
import { clone } from '../clone/index.js';

function clearObject(object) {
  if ('object' !== typeof object || null == object) {
    throw Error('Invalid object.');
  }
  Object.keys(object).forEach(key => delete object[key]);
  return object;
}

function normalizeRelation(relation) {
  return hasIri(relation) ? getIri(relation) : relation;
}

export function normalizeItemRelations(item) {
  const cloned = clone(item);
  const props = Object.keys(cloned);
  for (const prop of props) {
    const value = cloned[prop];
    if (Array.isArray(value)) {
      cloned[prop] = value.map(relation => normalizeRelation(relation));
    } else if ('object' === typeof value && null != value) {
      cloned[prop] = normalizeRelation(value);
    }
  }

  return cloned;
}

function recreateState(object, withObject) {
  object = clearObject(object);
  return Object.assign(object, withObject);
}

export function useItemForm(itemInitialState) {
  const store = useStore();
  const initialState = ref(unref(itemInitialState));
  const item = reactive(clone(unref(itemInitialState)));
  const isCreationMode = computed(() => !hasIri(unref(item)));
  const isSubmitting = ref(false);

  const isUnsavedDraft = computed(() => JSON.stringify(unref(item)) !== JSON.stringify(unref(initialState)));
  const reset = (resetItem) => recreateState(item, clone(unref(resetItem ?? itemInitialState)));

  const submit = async (submittedItem) => {
    if (isRef(submittedItem)) {
      submittedItem = unref(submittedItem);
    }
    try {
      isSubmitting.value = true;
      const updatedItem = await store.upsertItem(normalizeItemRelations(submittedItem ?? item));
      initialState.value = updatedItem;
      recreateState(item, clone(updatedItem));
      return updatedItem;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {item, isUnsavedDraft, isCreationMode, isSubmitting, reset, submit};
}

export function useFormValidation() {
  const unmappedViolations = ref([]);

  const resetValidity = (FormHTMLElement) => {
    FormHTMLElement = unref(FormHTMLElement);
    FormHTMLElement.querySelectorAll('[name]').forEach(function (element) {
      element.setCustomValidity('');
    });
    unmappedViolations.value = [];
  };

  const validate = (FormHTMLElement, report = true) => {
    FormHTMLElement = unref(FormHTMLElement);
    const isValid = FormHTMLElement.checkValidity();
    if (!isValid && report) {
      FormHTMLElement.reportValidity();
    }

    return isValid;
  };

  const bindViolations = (FormHTMLElement, violations) => {
    resetValidity(FormHTMLElement);
    Array.from(violations).forEach(violation => addViolation(FormHTMLElement, violation));
    validate(FormHTMLElement);
  };

  const addViolation = (FormHTMLElement, {propertyPath, message}) => {
    FormHTMLElement = unref(FormHTMLElement);
    const element =  FormHTMLElement.querySelector(`[name='${propertyPath}']`);
    element?.setCustomValidity(message);
    if (!element) {
      unmappedViolations.value.push({propertyPath, message});
    }
  };

  return {resetValidity, bindViolations, unmappedViolations, validate};
}

export * from './factories/constraint-violation-list.js';
export * from './factories/hydra-collection.js';
export * from './factories/hydra-error.js';
