<template>
  <div ref="rootRef" :class="['tree-view', { 'with-lines': showLines }]">
    <div
      v-for="(node, index) in nodes"
      :key="index"
      class="tree-node"
    >
      <div
        :class="[
          'tree-item',
          {
            disabled: node.disabled,
            'diagonal-active': showLines && (node.children && node.children.length > 0) && !colapsedNodes.has(index) && !node.disabled,
          }
        ]"
        @click="() => toggleNode(index)"
      >
        <span v-if="node.children && node.children.length > 0"
          :class="[
              'tree-shape',
              colapsedNodes.has(index) ? 'chevron-down' : 'line', // collapsed -> V, expanded -> horizontal line
              { 'tree-icon-hidden': node.disabled }
            ]"
        ></span>
        <span v-else
          :class="['tree-shape', 'circle', { 'tree-icon-hidden': node.disabled }]"
        ></span>
          <q-icon v-if="node.icon" :name="node.icon" />
          <span v-if="props.showLabels" class="tree-label">{{ node.data? node.label + ":" : node.label }}</span>
          <span v-if="node.data">
            <PrimitiveComponent :value="node.data" :label="node.label" :type="node.type ? node.type : 'text'"/>
          </span>
      </div>

      <div
        v-if="node.children && node.children.length > 0 && !colapsedNodes.has(index)"
        class="tree-children"
      >
        <TreeView
          :nodes="node.children"
          :show-lines="showLines"
          :show-labels="showLabels"
          @toggle-node="() => handleChildToggle(index)"
        >
        </TreeView>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldType } from 'src/models/table';
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import PrimitiveComponent from './PrimitiveComponent.vue';

export interface TreeNode {
  label?: string|undefined;
  data?: unknown;
  children?: TreeNode[];
  collapsible?: boolean;
  disabled?: boolean;
  type?: FieldType;
  icon?: string;
}

const props = defineProps<{
  nodes: TreeNode[];
  showLines?: boolean;
  showLabels?: boolean;
}>();

const emit = defineEmits<{
  'toggle-node': [index: number];
}>();

const colapsedNodes = ref<Set<number>>(new Set());

// refs for layout measurement
const rootRef = ref<HTMLElement | null>(null);

// Update per-connector CSS variables so each pseudo-element's background aligns
const updateConnectorPositions = async () => {
  await nextTick();
  if (!rootRef.value || !props.showLines) return;

  // We'll align to viewport (fixed gradient origin at 0,0)
  const items = Array.from(rootRef.value.querySelectorAll('.tree-item'));
  items.forEach((el) => {
    const r = el.getBoundingClientRect();
    // background-position on the element should shift the image by negative element coords
    (el as HTMLElement).style.setProperty('--bg-pos-x', `${-Math.round(r.left)}px`);
    (el as HTMLElement).style.setProperty('--bg-pos-y', `${-Math.round(r.top)}px`);
  });
};

const onWindowEvent = () => { void updateConnectorPositions(); };

onMounted(async () => {
  // initial
  await updateConnectorPositions();
  window.addEventListener('resize', onWindowEvent, { passive: true });
  window.addEventListener('scroll', onWindowEvent, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowEvent);
  window.removeEventListener('scroll', onWindowEvent);
});

// Recompute when nodes change or when collapsed set changes
watch(() => props.nodes, updateConnectorPositions, { deep: true });
watch(colapsedNodes, updateConnectorPositions, { deep: true });

const toggleNode = (index: number) => {
  const node = props.nodes[index];
  if (!node) return;
  // Don't toggle if disabled
  if (node.disabled) return;

  // Don't toggle if not collapsible (default true if has children)
  const isCollapsible = (node.collapsible !== false) && node.children && node.children.length > 0;
  if (!isCollapsible) return;

  if (colapsedNodes.value.has(index)) {
    colapsedNodes.value.delete(index);
  } else {
    colapsedNodes.value.add(index);
  }

  emit('toggle-node', index);
};

const handleChildToggle = (parentIndex: number) => {
  emit('toggle-node', parentIndex);
};
</script>

<style scoped lang="scss">
  // Quick edit variables
  $tree-color: $primary;
  $tree-shape-size: 7px;        // circle size
  $tree-chevron-size: 10px;      // chevron size
  $tree-line-width: 3px;         // connector line width
  $tree-shape-margin-right: 1px; // spacing after shape
  $tree-shape-margin-left: 3px; // spacing after shape
  $tree-connector-width: 12px;   // horizontal connector length
  $tree-left-offset: 8px;        // left offset for connectors
  $tree-indent: 12px;            // child indent (padding/margin left)
  // Connector gradient animation variables (replaces moving charge)
  $tree-gradient-duration: 28s;
  $tree-gradient-size: 200% 100%;
  $tree-gradient-alpha: 0.9;

.tree-view {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tree-node {
  display: flex;
  flex-direction: column;
  position: relative;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  user-select: none;
  position: relative;

  &:hover:not(.disabled) {
    background-color: rgba($primary, 0.2);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    color: rgba(255, 255, 255, 0.5);
  }
}


.tree-icon-hidden {
  visibility: hidden;
}

.circle {
  margin-left:calc( $tree-shape-margin-left + $tree-line-width / 2 );
  margin-right: calc( $tree-shape-margin-right + ( $tree-line-width / 2 ));
  border: $tree-line-width solid $tree-color;
  width: $tree-shape-size;
  height: $tree-shape-size;
  border-radius: 50%;
  background: transparent;
}

.chevron-down {
  width: $tree-chevron-size;
  height: $tree-chevron-size;
  border-top: $tree-line-width solid $tree-color;
  border-right: $tree-line-width solid $tree-color;
  transform-origin: center;
  transform: rotate(135deg);
  margin-left: $tree-shape-margin-left;
  margin-right: $tree-shape-margin-right;
}

// Horizontal line indicator for expanded nodes
.line {
  display: inline-block;
  width: $tree-chevron-size;
  height: $tree-line-width;
  background: $tree-color;
  border-radius: calc($tree-line-width / 2);
  vertical-align: middle;
  margin-left: $tree-shape-margin-left;
  margin-right: $tree-shape-margin-right;
}

.tree-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-children {
  padding-left: $tree-indent;
  margin-left: $tree-indent;
}

.with-lines .tree-item::before {
  content: '';
  position: absolute;
  left: -$tree-left-offset;
  top: 43%;
  width: $tree-connector-width;
  height: $tree-line-width;
  /* connectors sample a viewport-fixed horizontal gradient; only the pseudo-element paints it */
  background-color: $tree-color;
  z-index: 1;
}

.with-lines .tree-node::before {
  content: '';
  position: absolute;
  left: -$tree-left-offset;
  top: 0;
  bottom: 0;
  width: $tree-line-width;
  /* vertical connectors sample a viewport-fixed vertical gradient */
  background-color: $tree-color;
  z-index: 1;
}

</style>
