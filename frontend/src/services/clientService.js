import { ref } from 'vue';

export function useClientService() {
  const baseApiUrl = 'http://localhost:3000/api';

  /**
   * Obtiene la lista de clientes con opciones de búsqueda y paginación
   * @param {Object} options - Opciones de búsqueda y paginación
   * @returns {Promise<Object>} Lista de clientes y datos de paginación
   */
  async function getClients(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      
      const response = await fetch(`${baseApiUrl}/clients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error obteniendo clientes');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo clientes');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de un cliente por ID
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  async function getClientById(clientId) {
    try {
      const response = await fetch(`${baseApiUrl}/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error obteniendo cliente');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo cliente');
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo cliente
   * @param {Object} clientData - Datos del nuevo cliente
   * @returns {Promise<Object>} Cliente creado
   */
  async function createClient(clientData) {
    try {
      const response = await fetch(`${baseApiUrl}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(clientData)
      });
      
      if (!response.ok) {
        throw new Error('Error creando cliente');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error creando cliente');
      }
      
      return data.data.client;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Actualiza un cliente existente
   * @param {number} clientId - ID del cliente
   * @param {Object} clientData - Datos actualizados
   * @returns {Promise<Object>} Cliente actualizado
   */
  async function updateClient(clientId, clientData) {
    try {
      const response = await fetch(`${baseApiUrl}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(clientData)
      });
      
      if (!response.ok) {
        throw new Error('Error actualizando cliente');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error actualizando cliente');
      }
      
      return data.data.client;
    } catch (error) {
      console.error(`Error updating client ${clientId}:`, error);
      throw error;
    }
  }

  return {
    getClients,
    getClientById,
    createClient,
    updateClient
  };
}
