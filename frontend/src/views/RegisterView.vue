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
            <input id="usuario" v-model="form.nombre_usuario" type="text" required />
          </div>

          <div class="form-group">
            <label for="clave">Contraseña</label>
            <input id="clave" v-model="form.clave" :type="showPassword ? 'text' : 'password'" required />
          </div>

          <div class="form-group">
            <label for="confirmar">Confirmar contraseña</label>
            <input id="confirmar" v-model="form.confirmar" :type="showPassword ? 'text' : 'password'" required />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? 'no ver' : 'ver' }}
            </button>
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button class="btn-primary" type="submit" :disabled="loading">
            {{ loading ? 'Registrando…' : 'Registrarse' }}
          </button>

          <div class="form-footer">
            <router-link to="/login">Ya tengo cuenta</router-link>
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
const form = reactive({ nombre_usuario: '', clave: '', confirmar: '' });
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function onSubmit() {
  if (form.clave !== form.confirmar) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario: form.nombre_usuario, clave: form.clave }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al registrar');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    router.push('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>


