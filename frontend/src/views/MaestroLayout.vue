<template>
  <div class="layout">
    <header class="navbar">
      <div class="navbar__brand">SIPROA</div>
      <nav class="navbar__links">
        <router-link to="/">Home</router-link>
        <router-link to="/datos-generales">Datos generales</router-link>
        <router-link to="/datos-educativos">Datos educativos</router-link>
        <router-link to="/datos-curriculares">Datos curriculares</router-link>
        <router-link to="/productos">Productos académicos</router-link>
        <router-link to="/solicitudes">Solicitudes</router-link>
      </nav>
      <button class="navbar__logout" @click="logout">Salir</button>
    </header>

    <main class="layout__main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--sip-body); }
.navbar { height: 60px; background-color: var(--sip-navbar); display: flex; align-items: center; padding: 0 1.5rem; color: #fff; }
.navbar__brand { font-weight: 700; margin-right: 2rem; }
.navbar__links { display: flex; gap: 1rem; flex: 1; }
.navbar__links a { color: #fff; font-size: 0.9rem; }
.navbar__links a.router-link-active { text-decoration: underline; }
.navbar__logout { border: 1px solid #fff; background: transparent; color: #fff; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.layout__main { flex: 1; padding: 1.5rem; }
</style>
