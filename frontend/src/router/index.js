import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import MaestroLayout from '../views/MaestroLayout.vue';
import HomeView from '../views/HomeView.vue';
import DatosGeneralesView from '../views/DatosGeneralesView.vue';
import DatosEducativosView from '../views/DatosEducativosView.vue';
import DatosCurricularesView from '../views/DatosCurricularesView.vue';
import ProductosView from '../views/ProductosView.vue';
import SolicitudesView from '../views/SolicitudesView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  {
    path: '/',
    component: MaestroLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'datos-generales', name: 'datos-generales', component: DatosGeneralesView },
      { path: 'datos-educativos', name: 'datos-educativos', component: DatosEducativosView },
      { path: 'datos-curriculares', name: 'datos-curriculares', component: DatosCurricularesView },
      { path: 'productos', name: 'productos', component: ProductosView },
      { path: 'solicitudes', name: 'solicitudes', component: SolicitudesView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const isAuth = !!token;
  const isMaestro = user?.roles?.includes('MAESTRO');

  if (to.meta.requiresAuth && (!isAuth || !isMaestro)) {
    return next({ name: 'login' });
  }

  if ((to.name === 'login' || to.name === 'register') && isAuth && isMaestro) {
    return next({ name: 'home' });
  }

  next();
});

export default router;
