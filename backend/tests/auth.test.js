const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../src/server');
const { User } = require('../src/models');
const config = require('../src/config/config');

// Mock para User y limpiar después de las pruebas
jest.mock('../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    password: '$2b$10$X/iQxBu.3ChixTUzL0sTT.jgwY6HgEQOOyQ66VviEuhRYZdSKR4F2', // hash de "password123"
    role: 'secretary',
    active: true,
    temp_password_flag: false,
    findOne: jest.fn(),
    update: jest.fn()
  };
  
  return {
    User: {
      findOne: jest.fn().mockImplementation((query) => {
        if (query.where && query.where.username === 'testuser') {
          return Promise.resolve(mockUser);
        } else if (query.where && query.where.username === 'tempuser') {
          return Promise.resolve({
            ...mockUser,
            id: 2,
            username: 'tempuser',
            temp_password_flag: true
          });
        } else if (query.where && query.where.id === 1) {
          return Promise.resolve(mockUser);
        } else if (query.where && query.where.id === 2) {
          return Promise.resolve({
            ...mockUser,
            id: 2,
            username: 'tempuser',
            temp_password_flag: true
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(() => Promise.resolve([1]))
    }
  };
});

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((password, hash) => {
    // Simular verificación de contraseña
    if (password === 'password123') return Promise.resolve(true);
    return Promise.resolve(false);
  }),
  hash: jest.fn().mockImplementation(() => Promise.resolve('newhashpassword'))
}));

describe('API de Autenticación', () => {
  // Tests para el endpoint de login
  describe('POST /api/auth/login', () => {
    // Limpiar mocks después de cada prueba
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Debería autenticar un usuario válido y devolver token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username', 'testuser');
      expect(response.body.data.user).toHaveProperty('role', 'secretary');
      expect(response.body.data.user).toHaveProperty('temp_password_flag', false);
      expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    test('Debería devolver error para credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    test('Debería devolver error para usuario que no existe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    test('Debería indicar si el usuario tiene una contraseña temporal', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'tempuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('temp_password_flag', true);
    });
  });

  // Tests para el endpoint de cambio de contraseña
  describe('PUT /api/auth/change-password', () => {
    let token;

    beforeEach(() => {
      // Generar token para pruebas
      token = jwt.sign({ id: 1, role: 'secretary' }, config.jwt.secret, {
        expiresIn: '1h',
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Debería cambiar la contraseña correctamente', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'password123',
          new_password: 'newPassword456',
          confirm_password: 'newPassword456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');
      expect(response.body.data).toHaveProperty('temp_password_flag', false);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(User.update).toHaveBeenCalledTimes(1);
    });

    test('Debería devolver error si la contraseña actual es incorrecta', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'wrongPassword',
          new_password: 'newPassword456',
          confirm_password: 'newPassword456'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Contraseña actual incorrecta');
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.update).not.toHaveBeenCalled();
    });

    test('Debería devolver error si las nuevas contraseñas no coinciden', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'password123',
          new_password: 'newPassword456',
          confirm_password: 'differentPassword789'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Las contraseñas no coinciden');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.update).not.toHaveBeenCalled();
    });

    test('Debería devolver error si no hay token de autenticación', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          current_password: 'password123',
          new_password: 'newPassword456',
          confirm_password: 'newPassword456'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'No token proporcionado');
    });

    test('Debería devolver error si el token es inválido', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          current_password: 'password123',
          new_password: 'newPassword456',
          confirm_password: 'newPassword456'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Token inválido');
    });

    test('Debería cambiar la contraseña y actualizar el flag para usuarios con contraseña temporal', async () => {
      // Token para usuario con contraseña temporal
      const tempToken = jwt.sign({ id: 2, role: 'secretary' }, config.jwt.secret, {
        expiresIn: '1h',
      });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          current_password: 'password123',
          new_password: 'newPassword456',
          confirm_password: 'newPassword456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');
      expect(response.body.data).toHaveProperty('temp_password_flag', false);
      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'newhashpassword',
          temp_password_flag: false
        }),
        expect.any(Object)
      );
    });
  });
});
