<script setup lang="ts" generic="T extends object">
import { computed } from 'vue';
import type { TreeNode } from './TreeView.vue';
import TreeView from './TreeView.vue';

const props = defineProps<{
  obj: object;
}>();

const nodes = computed(() =>{
  const root:TreeNode = {
    label: 'Object',
    children: [],
  }
  buildTree(props.obj, root);
  return [root]
});
const buildTree = (obj: object, parent: TreeNode) => {
  Object.keys(obj).forEach((key)=>{
    const value = obj[key as keyof typeof obj];
    const childNode: TreeNode = {
      label: key,
      children: [],
    };
    if (value !== null && typeof value === 'object') {
      buildTree(value, childNode);
    } else {
      childNode.data = String(value);
    }
    parent.children!.push(childNode);
  });
};

</script>

<template>
  <TreeView :nodes="nodes" show-lines show-labels>
  </TreeView>
</template>

