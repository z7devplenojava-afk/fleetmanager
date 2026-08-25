import api from '@/lib/axios';

// --- Types ---

export interface WorkPostAssignmentEmployee {
  id: string;
  name: string;
}

export interface WorkPostAssignmentWorkPost {
  id: string;
  name: string;
}

export interface WorkPostAssignment {
  id: string;
  employee: WorkPostAssignmentEmployee;
  workPost: WorkPostAssignmentWorkPost;
  assignmentDate: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED';
  primaryAssignment?: boolean;
  backupAssignment?: boolean;
  observations?: string;
  specialInstructions?: string;
  assignedById?: string;
  assignmentDateTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkPostAssignmentRequest {
  employeeId: string;
  workPostId: string;
  assignmentDate: string;
  shiftType: string;
  startTime?: string;
  endTime?: string;
  observations?: string;
  specialInstructions?: string;
  isPrimaryAssignment?: boolean;
  isBackupAssignment?: boolean;
}

// --- Service ---

export const workPostAssignmentService = {
  /** Get all assignments */
  async getAll(): Promise<WorkPostAssignment[]> {
    const response = await api.get('/api/work-post-assignments');
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Get assignment by ID */
  async getById(id: string): Promise<WorkPostAssignment | null> {
    try {
      const response = await api.get(`/api/work-post-assignments/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /** Get assignments for a specific work post */
  async getByWorkPost(workPostId: string): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get(`/api/work-post-assignments/work-post/${workPostId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get assignments for a specific employee */
  async getByEmployee(employeeId: string): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get(`/api/work-post-assignments/employee/${employeeId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get assignments for a specific date */
  async getByDate(date: string): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get(`/api/work-post-assignments/date/${date}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get assignments within a date range */
  async getByDateRange(startDate: string, endDate: string): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get('/api/work-post-assignments/date-range', {
        params: { startDate, endDate },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get assignments for a work post within a date range */
  async getByWorkPostAndDateRange(
    workPostId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get(
        `/api/work-post-assignments/work-post/${workPostId}/date-range`,
        { params: { startDate, endDate } }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get today's assignments */
  async getToday(): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get('/api/work-post-assignments/today');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get pending assignments */
  async getPending(): Promise<WorkPostAssignment[]> {
    try {
      const response = await api.get('/api/work-post-assignments/pending');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Create a new assignment */
  async create(data: CreateWorkPostAssignmentRequest): Promise<WorkPostAssignment> {
    const response = await api.post('/api/work-post-assignments', data);
    return response.data;
  },

  /** Update an assignment */
  async update(id: string, data: CreateWorkPostAssignmentRequest): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}`, data);
    return response.data;
  },

  /** Update assignment status */
  async updateStatus(id: string, status: string): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  /** Confirm assignment */
  async confirm(id: string): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}/confirm`);
    return response.data;
  },

  /** Complete assignment */
  async complete(id: string): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}/complete`);
    return response.data;
  },

  /** Delete an assignment */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/work-post-assignments/${id}`);
  },
};

export default workPostAssignmentService;
