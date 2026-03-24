import api from './api';

export interface SeatTemplate {
    id?: string;
    name: string;
    description?: string;
    vehicleType: string;
    totalSeats: number;
    layoutJson: string; // JSON string representing the grid/layout
    companyId: string;
}

export interface RegularTrip {
    id: string;
    tripCode: string;
    departureTime: string;
    arrivalTime?: string;
    basePrice: number;
    status: string;
    seatTemplate: SeatTemplate;
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    seatNumber: string;
    passengerName: string;
    passengerDocument: string;
    status: string;
    salePrice: number;
    paymentMethod?: string;
    paymentId?: string;
    issuedAt?: string;
}

const ticketingService = {
    // Seat Templates
    async getTemplates(companyId?: string): Promise<SeatTemplate[]> {
        const params: any = {};
        if (companyId && companyId.trim() !== '' && companyId !== 'undefined' && companyId !== 'null') {
            params.companyId = companyId;
        }
        const response = await api.get('/seat-templates', { params });
        return response.data;
    },

    getTicketsByTrip: (tripId: string) => {
        return api.get<Ticket[]>(`/ticketing/trip/${tripId}/tickets`).then(res => res.data);
    },

    saveTemplate: (template: SeatTemplate) =>
        api.post<SeatTemplate>('/seat-templates', template).then(res => res.data),

    // Regular Trips
    searchTrips: (routeId: string, date: string) =>
        api.get<RegularTrip[]>(`/regular-trips/search?routeId=${routeId}&date=${date}`).then(res => res.data),

    getOccupiedSeats: (tripId: string) =>
        api.get<string[]>(`/regular-trips/${tripId}/occupied-seats`).then(res => res.data),

    saveTrip: (trip: any) =>
        api.post<RegularTrip>('/regular-trips', trip).then(res => res.data),

    // Ticketing
    reserveSeat: (data: { tripId: string; seatNumber: string; passengerName: string; passengerDoc: string; userId: string }) =>
        api.post<Ticket>('/ticketing/reserve', data).then(res => res.data),

    confirmPurchase: (ticketId: string, paymentMethod: string, paymentId: string) =>
        api.post<Ticket>(`/ticketing/confirm/${ticketId}?paymentMethod=${paymentMethod}&paymentId=${paymentId}`).then(res => res.data),
};

export default ticketingService;
