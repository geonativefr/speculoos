import { createStore } from '../../store/index.js';
import { createTestApp, useSetup } from '../../../vue-tests-setup.js';
import { ref, unref } from 'vue';
import { ApiClient } from '../../api-client/index.js';
import { HydraPlugin } from '../hydra-plugin.js';
import { mockResponse } from '../../api-client/tests/setup.js';
import { useFormValidation, useItemForm, ConstraintViolationList } from '../hydra-forms.js';

const response = ref();
const fetcher = async () => {
  const _response = unref(response);
  response.value = undefined;
  return _response;
};
const api = new ApiClient({fetcher, baseUri: 'https://example.org'});
const plugin = new HydraPlugin(api, {endpoints: {Foo: '/api/foos', Bar: '/api/bars'}});

it('creates the item', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const initialState = {'@type': 'Foo', name: ''};
  const expectedState = {'@id': '/api/foos/1', '@type': 'Foo', name: 'bar'};
  const form = await useSetup(createTestApp(storeFactory), async () => {
    const {item, submit, isCreationMode, isUnsavedDraft} = useItemForm(initialState);
    const wasUnsavedDraft = unref(isUnsavedDraft);
    const isCreationModeBefore = unref(isCreationMode);
    item.name = 'bar';
    const isUnsavedDraftBefore = unref(isUnsavedDraft);
    response.value = mockResponse({body: JSON.stringify(expectedState)});
    await submit();
    const isCreationModeAfter = unref(isCreationMode);
    const isUnsavedDraftAfter = unref(isUnsavedDraft);
    return {
      item,
      isCreationModeBefore,
      isCreationModeAfter,
      wasUnsavedDraft,
      isUnsavedDraftBefore,
      isUnsavedDraftAfter,
    };
  });
  expect(form.item).toEqual(expectedState);
  expect(form.isCreationModeBefore).toBe(true);
  expect(form.isCreationModeAfter).toBe(false);
  expect(form.wasUnsavedDraft).toBe(false);
  expect(form.isUnsavedDraftBefore).toBe(true);
  expect(form.isUnsavedDraftAfter).toBe(false);
});

it('updates the item', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const initialState = {'@id': '/api/foos/1', '@type': 'Foo', name: 'bar'};
  const expectedState = {'@id': '/api/foos/1', '@type': 'Foo', name: 'baz'};
  const form = await useSetup(createTestApp(storeFactory), async () => {
    const {item, submit, isCreationMode, isUnsavedDraft} = useItemForm(initialState);
    const wasUnsavedDraft = unref(isUnsavedDraft);
    const isCreationModeBefore = unref(isCreationMode);
    item.name = 'baz';
    const isUnsavedDraftBefore = unref(isUnsavedDraft);
    response.value = mockResponse({body: JSON.stringify(expectedState)});
    await submit();
    const isCreationModeAfter = unref(isCreationMode);
    const isUnsavedDraftAfter = unref(isUnsavedDraft);
    return {
      item,
      isCreationModeBefore,
      isCreationModeAfter,
      wasUnsavedDraft,
      isUnsavedDraftBefore,
      isUnsavedDraftAfter,
    };
  });
  expect(form.item).toEqual(expectedState);
  expect(form.isCreationModeBefore).toBe(false);
  expect(form.isCreationModeAfter).toBe(false);
  expect(form.wasUnsavedDraft).toBe(false);
  expect(form.isUnsavedDraftBefore).toBe(true);
  expect(form.isUnsavedDraftAfter).toBe(false);
});

it('resets the item', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const initialState = {'@id': '/api/foos/1', '@type': 'Foo', name: 'bar'};
  const form = await useSetup(createTestApp(storeFactory), async () => {
    const {item, reset, isCreationMode, isUnsavedDraft} = useItemForm(initialState);
    const wasUnsavedDraft = unref(isUnsavedDraft);
    const isCreationModeBefore = unref(isCreationMode);
    item.name = 'foo';
    const isUnsavedDraftBefore = unref(isUnsavedDraft);
    await reset();
    const isCreationModeAfter = unref(isCreationMode);
    const isUnsavedDraftAfter = unref(isUnsavedDraft);
    return {
      item,
      isCreationModeBefore,
      isCreationModeAfter,
      wasUnsavedDraft,
      isUnsavedDraftBefore,
      isUnsavedDraftAfter,
    };
  });
  expect(form.item).toEqual(initialState);
  expect(form.isCreationModeBefore).toBe(false);
  expect(form.isCreationModeAfter).toBe(false);
  expect(form.wasUnsavedDraft).toBe(false);
  expect(form.isUnsavedDraftBefore).toBe(true);
  expect(form.isUnsavedDraftAfter).toBe(false);
});

test('initial item can get deep changes without impacting form state', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const initialState = {
    '@id': '/api/foos/1',
    '@type': 'Foo',
    name: 'foo',
    bar: {
      '@id': '/api/bars/1',
      '@type': 'Bar',
      name: 'bar',
    },
  };
  const item = await useSetup(createTestApp(storeFactory), async () => {
    const {item} = useItemForm(initialState);
    initialState.name = 'FOO';
    initialState.bar.name = 'BAR';
    return item;
  });

  expect(initialState).toEqual({
    '@id': '/api/foos/1',
    '@type': 'Foo',
    name: 'FOO',
    bar: {
      '@id': '/api/bars/1',
      '@type': 'Bar',
      name: 'BAR',
    },
  });

  expect(item).toEqual({
    '@id': '/api/foos/1',
    '@type': 'Foo',
    name: 'foo',
    bar: {
      '@id': '/api/bars/1',
      '@type': 'Bar',
      name: 'bar',
    },
  });
});

it('binds violations', () => {
  const form = document.createElement('form');
  const FormHTMLElement = ref(form);
  const {validate, bindViolations, resetValidity} = useFormValidation();

  // When
  const name = document.createElement('input');
  name.setAttribute('name', 'name');
  form.appendChild(name);
  // Then
  expect(validate(FormHTMLElement)).toBe(true);

  // When
  name.setAttribute('required', true);
  // Then
  expect(validate(FormHTMLElement)).toBe(false);

  // When
  name.setAttribute('value', 'foo');
  // Then
  expect(validate(FormHTMLElement)).toBe(true);

  // When
  const violations = Object.assign(new ConstraintViolationList(), {
    '@context': '/api/contexts/ConstraintViolationList',
    '@type': 'ConstraintViolationList',
    'hydra:title': 'An error occurred',
    'hydra:description': 'name: The value cannot be `foo`.',
    'violations': [
      {
        'propertyPath': 'name',
        'message': 'The value cannot be `foo`.',
        'code': 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
      },
    ],
  });
  bindViolations(FormHTMLElement, violations);
  // Then
  expect(validate(FormHTMLElement)).toBe(false); // We have no API to retrieve customValidity message :/

  // When
  resetValidity(FormHTMLElement);
  // Then
  expect(validate(FormHTMLElement)).toBe(true);
});
