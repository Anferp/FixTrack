import Login from '../views/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('../views/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order-lookup',
    name: 'OrderLookup',
    component: () => import('../views/OrderLookup.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/order-lookup'
  },
  {
    path: '/secretary/dashboard',
    name: 'SecretaryDashboard',
    component: () => import('../views/secretary/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'secretary' }
  },
  {
    path: '/secretary/orders/new',
    name: 'CreateOrder',
    component: () => import('../views/secretary/CreateOrder.vue'),
    meta: { requiresAuth: true, role: 'secretary' }
  },
  {
    path: '/secretary/orders/:id',
    name: 'OrderDetail',
    component: () => import('../views/secretary/OrderDetail.vue'),
    meta: { requiresAuth: true, role: 'secretary' }
  },
  {
    path: '/technician/dashboard',
    name: 'TechnicianDashboard',
    component: () => import('../views/technician/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'technician' }
  },
  {
    path: '/technician/orders/:id',
    name: 'TechnicianOrderUpdate',
    component: () => import('../views/technician/OrderUpdate.vue'),
    meta: { requiresAuth: true, role: 'technician' }
  },
  {
    path: '/technician/all-orders',
    name: 'AllOrders',
    component: () => import('../views/technician/AllOrders.vue'),
    meta: { requiresAuth: true, role: 'technician' }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/admin/Users.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users/new',
    name: 'CreateUser',
    component: () => import('../views/admin/UserForm.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users/:id/edit',
    name: 'EditUser',
    component: () => import('../views/admin/UserForm.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('../views/admin/Reports.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  }
]

export default routes
