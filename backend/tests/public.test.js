const request = require('supertest');
const app = require('../src/server');
const { Order, OrderUpdate, OrderComment } = require('../src/models');

// Mock para los modelos de base de datos
jest.mock('../src/models', () => {
  // Datos de prueba para las órdenes
  const mockOrder = {
    id: 1,
    ticket_code: 'FIX12345678',
    security_key: 'A7B9C3D2',
    client_name: 'Juan Pérez',
    service_type: 'equipment_repair',
    problem_description: 'Laptop no enciende',
    status: 'in_review',
    created_at: '2023-11-15T10:30:00Z',
    updated_at: '2023-11-16T14:20:00Z',
    accessories: JSON.stringify(['Cargador', 'Mouse']),
    client_phone: '123456789',
    client_email: 'juanperez@example.com',
    get: function() {
      return {
        id: this.id,
        ticket_code: this.ticket_code,
        security_key: this.security_key,
        client_name: this.client_name,
        service_type: this.service_type,
        problem_description: this.problem_description,
        status: this.status,
        created_at: this.created_at,
        updated_at: this.updated_at,
        accessories: JSON.parse(this.accessories),
        client_phone: this.client_phone,
        client_email: this.client_email
      };
    },
    toJSON: function() {
      const json = this.get();
      delete json.security_key;
      return json;
    }
  };

  // Datos de prueba para actualizaciones
  const mockUpdates = [
    {
      id: 1,
      order_id: 1,
      old_status: 'pending',
      new_status: 'in_review',
      created_at: '2023-11-15T14:30:00Z',
      change_note: 'Asignado a técnico para revisión',
      get: function() { return this; }
    },
    {
      id: 2,
      order_id: 1,
      old_status: 'in_review',
      new_status: 'waiting_parts',
      created_at: '2023-11-16T14:20:00Z',
      change_note: 'Esperando repuesto de ventilador',
      get: function() { return this; }
    }
  ];

  // Datos de prueba para comentarios
  const mockComments = [
    {
      id: 1,
      order_id: 1,
      content: 'Se ha identificado un problema con el disco duro.',
      created_at: '2023-11-15T15:45:00Z',
      visible_to_client: true,
      get: function() { return this; }
    },
    {
      id: 2,
      order_id: 1,
      content: 'Es necesario reemplazar el ventilador. El repuesto llegará en 2 días.',
      created_at: '2023-11-16T14:25:00Z',
      visible_to_client: true,
      get: function() { return this; }
    }
  ];

  return {
    Order: {
      findByTicketAndKey: jest.fn().mockImplementation((ticket, key) => {
        if (ticket === 'FIX12345678' && key === 'A7B9C3D2') {
          return Promise.resolve(mockOrder);
        }
        return Promise.resolve(null);
      })
    },
    OrderUpdate: {
      findAll: jest.fn().mockImplementation((query) => {
        if (query.where && query.where.order_id === 1) {
          return Promise.resolve(mockUpdates);
        }
        return Promise.resolve([]);
      })
    },
    OrderComment: {
      findAll: jest.fn().mockImplementation((query) => {
        if (query.where && query.where.order_id === 1 && query.where.visible_to_client === true) {
          return Promise.resolve(mockComments);
        }
        return Promise.resolve([]);
      })
    }
  };
});

describe('API de Acceso Público', () => {
  // Limpiar mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test para obtener información de una orden
  describe('GET /api/public/order/:ticket_code/:security_key', () => {
    test('Debería obtener los detalles de una orden válida', async () => {
      const response = await request(app)
        .get('/api/public/order/FIX12345678/A7B9C3D2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order).toHaveProperty('ticket_code', 'FIX12345678');
      expect(response.body.data.order).toHaveProperty('client_name', 'Juan Pérez');
      expect(response.body.data.order).toHaveProperty('service_type', 'equipment_repair');
      expect(response.body.data.order).toHaveProperty('problem_description', 'Laptop no enciende');
      expect(response.body.data.order).toHaveProperty('status', 'in_review');
      expect(response.body.data.order).toHaveProperty('accessories');
      expect(response.body.data.order.accessories).toContain('Cargador');
      expect(response.body.data.order.accessories).toContain('Mouse');
      expect(response.body.data.order).not.toHaveProperty('security_key');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(Order.findByTicketAndKey).toHaveBeenCalledWith('FIX12345678', 'A7B9C3D2');
    });

    test('Debería devolver error para una orden que no existe', async () => {
      const response = await request(app)
        .get('/api/public/order/INVALID123/WRONGKEY');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Orden no encontrada o clave de seguridad incorrecta');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(Order.findByTicketAndKey).toHaveBeenCalledWith('INVALID123', 'WRONGKEY');
    });
  });

  // Test para obtener actualizaciones de una orden
  describe('GET /api/public/order/updates/:ticket_code/:security_key', () => {
    test('Debería obtener el historial de actualizaciones de una orden válida', async () => {
      const response = await request(app)
        .get('/api/public/order/updates/FIX12345678/A7B9C3D2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('updates');
      expect(Array.isArray(response.body.data.updates)).toBe(true);
      expect(response.body.data.updates.length).toBe(2);
      expect(response.body.data.updates[0]).toHaveProperty('old_status', 'pending');
      expect(response.body.data.updates[0]).toHaveProperty('new_status', 'in_review');
      expect(response.body.data.updates[0]).toHaveProperty('change_note', 'Asignado a técnico para revisión');
      expect(response.body.data.updates[1]).toHaveProperty('old_status', 'in_review');
      expect(response.body.data.updates[1]).toHaveProperty('new_status', 'waiting_parts');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(OrderUpdate.findAll).toHaveBeenCalledTimes(1);
    });

    test('Debería devolver error para una orden que no existe', async () => {
      const response = await request(app)
        .get('/api/public/order/updates/INVALID123/WRONGKEY');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Orden no encontrada o clave de seguridad incorrecta');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(OrderUpdate.findAll).not.toHaveBeenCalled();
    });
  });

  // Test para obtener comentarios de una orden
  describe('GET /api/public/order/comments/:ticket_code/:security_key', () => {
    test('Debería obtener los comentarios visibles para el cliente de una orden válida', async () => {
      const response = await request(app)
        .get('/api/public/order/comments/FIX12345678/A7B9C3D2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('comments');
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments.length).toBe(2);
      expect(response.body.data.comments[0]).toHaveProperty('content', 'Se ha identificado un problema con el disco duro.');
      expect(response.body.data.comments[1]).toHaveProperty('content', 'Es necesario reemplazar el ventilador. El repuesto llegará en 2 días.');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(OrderComment.findAll).toHaveBeenCalledTimes(1);
    });

    test('Debería devolver error para una orden que no existe', async () => {
      const response = await request(app)
        .get('/api/public/order/comments/INVALID123/WRONGKEY');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Orden no encontrada o clave de seguridad incorrecta');
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(OrderComment.findAll).not.toHaveBeenCalled();
    });

    test('Debería devolver un array vacío si no hay comentarios visibles', async () => {
      // Modificar el mock solo para esta prueba
      OrderComment.findAll.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/public/order/comments/FIX12345678/A7B9C3D2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('comments');
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments.length).toBe(0);
      expect(Order.findByTicketAndKey).toHaveBeenCalledTimes(1);
      expect(OrderComment.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
