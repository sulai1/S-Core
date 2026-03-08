<template>
  <div class="login-container">
    <q-card class="login-card">
      <q-card-section>
        <div class="text-h6">Login</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-none">
        <q-form @submit.prevent="handleLogin">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            class="q-mb-md"
            :rules="[(val) => !!val || 'Email is required']"
          />

          <q-input
            v-model="password"
            label="Password"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[(val) => !!val || 'Password is required']"
          />

          <q-linear-progress
            v-if="loading"
            indeterminate
            color="primary"
            class="q-mb-md"
          />

          <div v-if="error" class="text-negative q-mb-md">
            {{ error }}
          </div>

          <q-btn
            label="Login"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { routes } from 'boot/di';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    await routes['/auth/login'].post({
      email: email.value,
      password: password.value,
    });

    await router.push('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
</style>
