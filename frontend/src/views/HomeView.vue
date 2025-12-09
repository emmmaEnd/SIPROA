<template>
  <div class="card">
    <h1>Home</h1>
    <p v-if="mensaje">{{ mensaje }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const mensaje = ref('');
const error = ref('');
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

onMounted(async () => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/api/maestro/home`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error en home');
    mensaje.value = data.message;
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped>
.card { max-width: 600px; margin: 0 auto; background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.error { color: #b91c1c; }
</style>
