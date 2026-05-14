<template>
  <div class="login-page flex flex-center">
    <q-card class="login-card q-pa-lg">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Sign in required</div>
        <div class="text-body2 q-mt-sm text-grey-8">
          Production mode requires authentication with Keycloak before using AudioGrabber.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="authState.error" class="text-negative">
        {{ authState.error }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          unelevated
          :loading="loading"
          icon="login"
          label="Continue with Keycloak"
          @click="onLogin"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { authState, initializeAuth, loginWithKeycloak } from 'src/auth/keycloak';

const route = useRoute();
const loading = ref(false);

const redirectPath = computed(() => {
  const value = route.query.redirect;
  return typeof value === 'string' && value.length > 0 ? value : '/download';
});

void initializeAuth();

const onLogin = async (): Promise<void> => {
  loading.value = true;
  try {
    await loginWithKeycloak(redirectPath.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 16px;
}

.login-card {
  width: min(520px, 96vw);
  border-radius: 16px;
}
</style>
