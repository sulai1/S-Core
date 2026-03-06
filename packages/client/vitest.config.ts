import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedVitestConfig } from '../../vitest.base.js';

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({}),
);