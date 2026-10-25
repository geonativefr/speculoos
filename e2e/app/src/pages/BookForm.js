import { ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ConstraintViolationList,
  HydraError,
  useFormValidation,
  useItemForm,
  useStore,
} from 'speculoos';
import { recordError, settledBookLoads } from '../App.js';

// Composables need the component instance, which a setup() loses after its first await: the editor gets the book loaded.
const BookEditor = {
  props: {
    book: {type: Object, required: true},
  },
  setup(props) {
    const {item, isCreationMode, reset, submit} = useItemForm(props.book);
    const {bindViolations, resetValidity} = useFormValidation();
    const formElement = ref();
    const attempts = ref(0);
    const error = ref();
    const violations = ref([]);

    const save = async () => {
      error.value = undefined;
      violations.value = [];
      resetValidity(formElement);
      try {
        await submit();
      } catch (e) {
        if (e instanceof ConstraintViolationList) {
          violations.value = e.violations.map(({propertyPath, message}) => `${propertyPath}: ${message}`);
          bindViolations(formElement, e);
        } else {
          error.value = {
            kind: e instanceof HydraError ? 'HydraError' : e.name,
            status: e.statusCode,
            title: e.title,
            message: e.message,
          };
        }
      } finally {
        attempts.value++;
      }
    };

    return {item, isCreationMode, reset, save, formElement, attempts, error, violations};
  },
  template: `
    <form ref="formElement" novalidate data-test="book-form" @submit.prevent="save">
      <p data-test="mode">{{ isCreationMode ? 'creation' : 'edition' }}</p>
      <p data-test="iri">{{ item['@id'] }}</p>
      <label>Title <input name="title" v-model="item.title"></label>
      <button type="submit" data-test="save">Save</button>
      <button type="button" data-test="reset" @click="reset()">Reset</button>
      <p data-test="attempts">{{ attempts }}</p>
      <p v-if="error" data-test="error">{{ error.kind }} {{ error.status }} {{ error.title }}</p>
      <p v-if="error" data-test="error-message">{{ error.message }}</p>
      <ul data-test="violations">
        <li v-for="violation in violations" :key="violation">{{ violation }}</li>
      </ul>
    </form>
  `,
};

export default {
  components: {BookEditor},
  async setup() {
    const store = useStore();
    const route = useRoute();
    if (!route.params.id) {
      return {book: {'@type': 'Book', title: ''}};
    }

    try {
      return {book: await store.getItem(`/api/books/${route.params.id}`)};
    } catch (e) {
      recordError(e);
      return {book: undefined};
    } finally {
      settledBookLoads.value++;
    }
  },
  template: `
    <BookEditor v-if="book" :book="book" />
    <p v-else data-test="unavailable">This book is not available.</p>
  `,
};
