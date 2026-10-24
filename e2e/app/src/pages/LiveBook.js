import { onUnmounted, ref } from 'vue';
import { useMercure, useMercureSync, useStore } from 'speculoos';

export default {
  async setup() {
    const store = useStore();
    const mercure = useMercure();
    const {synchronize} = useMercureSync();
    const opens = ref(0);
    const errors = ref(0);
    const onOpen = () => opens.value++;
    const onError = () => errors.value++;
    mercure.emitter.on('open', onOpen);
    mercure.emitter.on('error', onError);
    onUnmounted(() => {
      mercure.emitter.off('open', onOpen);
      mercure.emitter.off('error', onError);
    });

    const book = await store.getItem('/api/books/1');
    synchronize(book, [book['@id']]);

    const author = ref();
    // Subscribes to the author's topic once the connection is open
    const followAuthor = async () => {
      author.value = await store.getItem(book.author);
      synchronize(author.value, [author.value['@id']]);
    };
    const stop = () => mercure.stop();

    return {book, author, followAuthor, stop, opens, errors};
  },
  template: `
    <h1 data-test="book-title">{{ book.title }}</h1>
    <p v-if="author" data-test="author-name">{{ author.name }}</p>
    <button type="button" data-test="follow-author" @click="followAuthor()">Follow the author</button>
    <button type="button" data-test="stop" @click="stop()">Stop live updates</button>
    <p>Connections opened: <span data-test="opens">{{ opens }}</span></p>
    <p>Connection errors: <span data-test="errors">{{ errors }}</span></p>
  `,
};
