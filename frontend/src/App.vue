<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const mensaje = ref('Cargando...')

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/hello')
    mensaje.value = res.data.message
  } catch (err) {
    console.error(err)
    mensaje.value = 'Error al conectar con la API'
  }
})
</script>

<template>
  <main style="padding: 2rem; font-family: system-ui;">
    <h1>Frontend Vue + Backend Express</h1>
    <p>Respuesta de la API:</p>
    <pre>{{ mensaje }}</pre>
  </main>
</template>

<style scoped>
h1 {
  margin-bottom: 1rem;
}
</style>
