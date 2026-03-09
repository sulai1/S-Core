import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import ExampleComponent from './ExampleComponent.vue';

describe('ExampleComponent', () => {
  test('renders properly', () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        title: 'Test Title',
        active: true,
        meta: { totalCount: 10 },
        todos: [
          { id: 1, content: 'Test Todo 1' },
          { id: 2, content: 'Test Todo 2' }
        ]
      }
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Count: 2 / 10');
    expect(wrapper.text()).toContain('Active: yes');
  });

  test('emits event on button click', async () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        title: 'Test',
        active: true,
        meta: { totalCount: 10 },
        todos: [
          { id: 1, content: 'Test Todo 1' },
          { id: 2, content: 'Test Todo 2' }
        ]
      }
    });

    const button = wrapper.find('button');
    if (button.exists()) {
      await button.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('click');
    }
  });
});
