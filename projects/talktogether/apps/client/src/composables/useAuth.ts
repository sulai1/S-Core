import { ref, computed } from 'vue';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

const currentUser = ref<User | null>(null);
const isAuthenticated = computed(() => !!currentUser.value);

export async function initializeAuth() {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });
    const data = await response.json();
    if (data.authenticated) {
      currentUser.value = data.user;
    }
  } catch (error) {
    console.error('Failed to check authentication:', error);
  }
}

export function setAuthUser(user: User) {
  currentUser.value = user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    currentUser.value = null;
  } catch (error) {
    console.error('Logout failed:', error);
    currentUser.value = null;
  }
}

export function useAuth() {
  return {
    currentUser,
    isAuthenticated,
  };
}
