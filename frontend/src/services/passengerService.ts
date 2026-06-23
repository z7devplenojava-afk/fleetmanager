import { api } from './api';
import type { Passenger, Boarding, Disembarking } from '@/types/passenger';

export const passengerService = {
  // Passenger CRUD
  getAllPassengers: async (companyId: string): Promise<Passenger[]> => {
    const response = await api.get(`/passengers/company/${companyId}`);
    return response.data;
  },

  getPassengersByRoute: async (routeId: string): Promise<Passenger[]> => {
    const response = await api.get(`/passengers/route/${routeId}`);
    return response.data;
  },

  getActivePassengers: async (companyId: string): Promise<Passenger[]> => {
    const response = await api.get(`/passengers/company/${companyId}/active`);
    return response.data;
  },

  getPassengerById: async (id: string): Promise<Passenger> => {
    const response = await api.get(`/passengers/${id}`);
    return response.data;
  },

  createPassenger: async (passengerData: Partial<Passenger>): Promise<Passenger> => {
    const response = await api.post('/passengers', passengerData);
    return response.data;
  },

  updatePassenger: async (id: string, passengerData: Partial<Passenger>): Promise<Passenger> => {
    const response = await api.put(`/passengers/${id}`, passengerData);
    return response.data;
  },

  deletePassenger: async (id: string): Promise<void> => {
    await api.delete(`/passengers/${id}`);
  },

  // Boarding operations
  getBoardingsByTrip: async (tripId: string): Promise<Boarding[]> => {
    const response = await api.get(`/boardings/trip/${tripId}`);
    return response.data;
  },

  getBoardingsByPassenger: async (passengerId: string): Promise<Boarding[]> => {
    const response = await api.get(`/boardings/passenger/${passengerId}`);
    return response.data;
  },

  checkIn: async (data: { tripId: string; passengerId: string; latitude?: number; longitude?: number }): Promise<Boarding> => {
    const response = await api.post('/boardings/check-in', data);
    return response.data;
  },

  createBoarding: async (boardingData: Partial<Boarding>): Promise<Boarding> => {
    const response = await api.post('/boardings', boardingData);
    return response.data;
  },

  updateBoarding: async (id: string, boardingData: Partial<Boarding>): Promise<Boarding> => {
    const response = await api.put(`/boardings/${id}`, boardingData);
    return response.data;
  },

  deleteBoarding: async (id: string): Promise<void> => {
    await api.delete(`/boardings/${id}`);
  },

  // Disembarking operations
  getDisembarkingByBoarding: async (boardingId: string): Promise<Disembarking | null> => {
    try {
      const response = await api.get(`/disembarkings/boarding/${boardingId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  checkOut: async (data: { boardingId: string; latitude?: number; longitude?: number }): Promise<Disembarking> => {
    const response = await api.post('/disembarkings/check-out', data);
    return response.data;
  },

  createDisembarking: async (disembarkingData: Partial<Disembarking>): Promise<Disembarking> => {
    const response = await api.post('/disembarkings', disembarkingData);
    return response.data;
  },

  updateDisembarking: async (id: string, disembarkingData: Partial<Disembarking>): Promise<Disembarking> => {
    const response = await api.put(`/disembarkings/${id}`, disembarkingData);
    return response.data;
  },

  deleteDisembarking: async (id: string): Promise<void> => {
    await api.delete(`/disembarkings/${id}`);
  }
};
