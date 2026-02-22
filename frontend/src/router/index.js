import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../components/views/DashboardView.vue'),
  },
  {
    path: '/agents',
    name: 'agents',
    component: () => import('../components/views/AgentsView.vue'),
  },
  {
    path: '/convoys',
    name: 'convoys',
    component: () => import('../components/views/ConvoysView.vue'),
  },
  {
    path: '/mail',
    name: 'mail',
    component: () => import('../components/views/MailView.vue'),
  },
  {
    path: '/issues',
    name: 'issues',
    component: () => import('../components/views/IssuesView.vue'),
  },
  {
    path: '/prs',
    name: 'prs',
    component: () => import('../components/views/PrsView.vue'),
  },
  {
    path: '/formulas',
    name: 'formulas',
    component: () => import('../components/views/FormulasView.vue'),
  },
  {
    path: '/work',
    name: 'work',
    component: () => import('../components/views/WorkView.vue'),
  },
  {
    path: '/rigs',
    name: 'rigs',
    component: () => import('../components/views/RigsView.vue'),
  },
  {
    path: '/crews',
    name: 'crews',
    component: () => import('../components/views/CrewsView.vue'),
  },
  {
    path: '/health',
    name: 'health',
    component: () => import('../components/views/HealthView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
