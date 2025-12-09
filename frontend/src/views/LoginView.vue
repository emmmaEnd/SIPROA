<template>
  <div class="auth-page">
    <header class="top-bar">
      <div class="top-bar__brand">SIPROA</div>
    </header>

    <main class="auth-main">
      <section class="auth-card">
        <div class="auth-card__header">
          
        </div>

        <form class="auth-card__form" @submit.prevent="onSubmit">
          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input
              id="usuario"
              v-model="form.nombre_usuario"
              type="text"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="clave">Contraseña</label>
            <input
              id="clave"
              v-model="form.clave"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>

          <p v-if="error" class="error-message">
            {{ error }}
          </p>

          <button class="btn-primary" type="submit" :disabled="loading">
            {{ loading ? 'Ingresando…' : 'Ingresar' }}
          </button>

          <div class="form-footer">
            <a href="javascript:void(0)">¿Olvidaste tu contraseña?</a>
            <router-link to="/register">Registrar usuario</router-link>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = reactive({
  nombre_usuario: '',
  clave: '',
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function onSubmit() {
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    router.push('/home'); // la ruta de Home maestro
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
