<template>
  <div class="card">
    <h2>Productos académicos</h2>
    <p>Listado de productos (pendiente conectar a la tabla producto_academico).</p>

    <h3>Subir documento de prueba</h3>
    <form @submit.prevent="subirArchivo">
      <input type="file" @change="onFileChange" required />
      <button type="submit">Subir</button>
    </form>

    <p v-if="uploadError" class="error">{{ uploadError }}</p>
    <p v-if="uploadUrl">
      Archivo subido: <a :href="uploadUrl" target="_blank">{{ uploadUrl }}</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const archivo = ref(null);
const uploadError = ref('');
const uploadUrl = ref('');
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function onFileChange(e) {
  archivo.value = e.target.files[0] || null;
}

async function subirArchivo() {
  uploadError.value = '';
  uploadUrl.value = '';

  if (!archivo.value) {
    uploadError.value = 'Selecciona un archivo';
    return;
  }

  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('archivo', archivo.value);

  try {
    const res = await fetch(`${API_BASE}/api/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al subir archivo');

    uploadUrl.value = data.url;
  } catch (err) {
    uploadError.value = err.message;
  }
}
</script>

<style scoped>
.card { max-width: 900px; margin: 0 auto; background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.error { color: #b91c1c; }
button { margin-top: 0.5rem; padding: 0.4rem 0.8rem; background-color: var(--sip-button); border: none; color: #fff; border-radius: 4px; cursor: pointer; }
</style>
