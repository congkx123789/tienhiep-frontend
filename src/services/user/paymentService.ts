import api from '../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';

export const paymentService = {
  getPlans: async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.PLANS);
    return res.data;
  },

  createCheckout: async (planId: string) => {
    const res = await api.post(API_ENDPOINTS.PAYMENTS.CHECKOUT, { plan_id: planId });
    return res.data;
  },

  verifyPayment: async (orderId: string) => {
    const res = await api.post(API_ENDPOINTS.PAYMENTS.VERIFY, { order_id: orderId });
    return res.data;
  },

  getVipStatus: async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.VIP_STATUS);
    return res.data;
  },
};

export default paymentService;
