import { computed, reactive, ref, unref, watch } from 'vue';
import { hasIri } from './iri-functions.js';
import { useStore } from '../store/index.js';
import { clone } from '../clone/index.js';

function clearObject(object) {
  if ('object' !== typeof object || null == object) {
    throw Error('Invalid object.');
  }
  Object.keys(object).forEach(key => delete object[key]);
  return object;
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
  watch(initialState, newInitialState => recreateState(item, newInitialState));

  const isUnsavedDraft = computed(() => JSON.stringify(unref(item)) !== JSON.stringify(unref(initialState)));
  const reset = () => recreateState(item, clone(unref(itemInitialState)));

  const submit = async () => {
    try {
      isSubmitting.value = true;
      const updatedItem = await store.upsertItem(item);
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
  const resetValidity = (FormHTMLElement) => {
    FormHTMLElement = unref(FormHTMLElement);
    FormHTMLElement.querySelectorAll('[name]').forEach(function (element) {
      element.setCustomValidity('');
    });
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
    FormHTMLElement.querySelector(`[name='${propertyPath}']`)?.setCustomValidity(message);
  };

  return {resetValidity, bindViolations, validate};
}

export * from './factories/constraint-violation-list.js';
export * from './factories/hydra-collection.js';
export * from './factories/hydra-error.js';
