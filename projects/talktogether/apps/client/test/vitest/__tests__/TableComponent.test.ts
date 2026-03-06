import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { config, mount } from '@vue/test-utils';
import TableComponent from 'src/components/TableComponent.vue';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

// Stub q-virtual-scroll to just render all items in a <tbody>
config.global.stubs['q-virtual-scroll'] = {
  props: ['items'],
  template: `
    <thead>
      <slot name="before" />
    </thead>
    <tbody>
    <slot v-for="item in items" :item="item" />
  </tbody>`
};
installQuasarPlugin();

describe('example Component', () => {
  it('should mount component with todos', async () => {
    const data = [{ a: 1, b: 2, c: '1' }, { a: 2, b: 1, c: '11' }, { a: 3, b: 2, c: '22' }]
    const wrapper = mount(TableComponent, {
      props: {
        data,
        columns: [
          { property: (row: unknown) => String((row as { a: number, b: number, c: string }).a), headerName: 'a', sortable: true },
          { property: (row: unknown) => String((row as { a: number, b: number, c: string }).b), headerName: 'b', sortable: true },
          { property: (row: unknown) => String((row as { a: number, b: number, c: string }).c), headerName: 'c', sortable: true },
          { property: (row: unknown) => String((row as { a: number, b: number, c: string }).a + (row as { a: number, b: number, c: string }).b), headerName: 'd', sortable: true }
        ]
      },
      attachTo: document.body, // Ensures real DOM for virtual scroll
      attrs: { style: 'height: 400px; display: block;' }
    });
    await nextTick();
    const tableElement = wrapper.find('table').element

    // Only visible rows are rendered, so check for at least one row
    const visibleRows = wrapper.findAll('tbody tr');
    expect(visibleRows.length).toBeGreaterThan(0);

    // Check the number of rows and cells
    expect(tableElement.rows.length).toBe(4); // 1 header + 3 data rows
    expect(tableElement.rows[0]?.cells.length).toBe(4);

    const headerCells = wrapper.findAll('thead th');
    expect(headerCells.length).toBe(4);
    expect(headerCells[0]?.text()).toBe('a');
    expect(headerCells[1]?.text()).toBe('b');
    expect(headerCells[2]?.text()).toBe('c');
    expect(headerCells[3]?.text()).toBe('d');

    const tableRows = wrapper.findAll<HTMLTableRowElement>('tr');
    expect(tableRows.length).toBe(4);

    for (let i = 0; i < data.length; i++) {
      const row = tableRows[i + 1]?.element;
      const dataRow = data[i];


      expect(row?.cells[0]!.textContent).toBe(String(dataRow?.a));
      expect(row?.cells[1]!.textContent).toBe(String(dataRow?.b));
      expect(row?.cells[2]!.textContent).toBe(String(dataRow?.c));
      expect(row?.cells[3]!.textContent).toBe(String(dataRow ? dataRow.a + dataRow.b : ''));
    }

  });
});
