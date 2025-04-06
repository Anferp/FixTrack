import { ref } from 'vue';

export function useOrderService() {
  const baseApiUrl = 'http://localhost:3000/api';

  /**
   * Obtiene los detalles de una orden para clientes usando el ticket y clave de seguridad
   * @param {string} ticketCode - Código de ticket 
   * @param {string} securityKey - Clave de seguridad
   * @returns {Promise<Object>} Datos de la orden
   */
  async function getPublicOrder(ticketCode, securityKey) {
    try {
      const response = await fetch(`${baseApiUrl}/public/order/${ticketCode}/${securityKey}`);
      
      if (!response.ok) {
        throw new Error('Orden no encontrada o clave incorrecta');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo la orden');
      }
      
      return data.data.order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Obtiene las actualizaciones de estado de una orden para clientes
   * @param {string} ticketCode - Código de ticket
   * @param {string} securityKey - Clave de seguridad
   * @returns {Promise<Array>} Lista de actualizaciones
   */
  async function getPublicOrderUpdates(ticketCode, securityKey) {
    try {
      const response = await fetch(`${baseApiUrl}/public/order/updates/${ticketCode}/${securityKey}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo actualizaciones');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo actualizaciones');
      }
      
      return data.data.updates;
    } catch (error) {
      console.error('Error fetching order updates:', error);
      throw error;
    }
  }

  /**
   * Obtiene los comentarios visibles para el cliente de una orden
   * @param {string} ticketCode - Código de ticket
   * @param {string} securityKey - Clave de seguridad
   * @returns {Promise<Array>} Lista de comentarios
   */
  async function getPublicOrderComments(ticketCode, securityKey) {
    try {
      const response = await fetch(`${baseApiUrl}/public/order/comments/${ticketCode}/${securityKey}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo comentarios');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo comentarios');
      }
      
      return data.data.comments;
    } catch (error) {
      console.error('Error fetching order comments:', error);
      throw error;
    }
  }

  return {
    getPublicOrder,
    getPublicOrderUpdates,
    getPublicOrderComments
  };
}
