export type TicketStatus = 'pending' | 'in_progress' | 'answered' | 'rejected';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketCategory = 'technical' | 'billing' | 'account' | 'general';

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface TicketResponse {
  id: string;
  content: string;
  attachments: Attachment[];
  respondedBy: string;
  respondedAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userEmail: string;
  question: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: TicketResponse[];
  isEscalated: boolean;
  escalatedAt?: string;
  escalationReason?: string;
  tags: string[];
  readStatus: boolean;
}

// Function to determine if a ticket should be escalated
export function shouldEscalate(ticket: Ticket): boolean {
  if (ticket.status !== 'pending') return false;
  
  // Escalate tickets that are high priority and have been open for more than 4 hours
  const createdTime = new Date(ticket.createdAt).getTime();
  const currentTime = new Date().getTime();
  const hoursDifference = (currentTime - createdTime) / (1000 * 60 * 60);
  
  if (ticket.priority === 'high' && hoursDifference > 4) {
    return true;
  }
  
  // Escalate any ticket that has been open for more than 24 hours
  if (hoursDifference > 24) {
    return true;
  }
  
  return false;
}

// Function to get proper CSS classes for status badges
export function getStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case 'pending': return 'status-badge status-pending';
    case 'in_progress': return 'status-badge status-in-progress';
    case 'answered': return 'status-badge status-answered';
    case 'rejected': return 'status-badge status-rejected';
    default: return 'status-badge';
  }
}

// Function to get proper CSS classes for priority badges
export function getPriorityBadgeClass(priority: TicketPriority): string {
  switch (priority) {
    case 'low': return 'status-badge priority-low';
    case 'medium': return 'status-badge priority-medium';
    case 'high': return 'status-badge priority-high';
    default: return 'status-badge';
  }
}

// Function to format time elapsed since ticket creation
export function getTimeElapsed(dateString: string): string {
  const createdTime = new Date(dateString).getTime();
  const currentTime = new Date().getTime();
  const minutesDifference = Math.floor((currentTime - createdTime) / (1000 * 60));
  
  if (minutesDifference < 1) return 'just now';
  if (minutesDifference === 1) return '1 minute ago';
  if (minutesDifference < 60) return `${minutesDifference} minutes ago`;
  
  const hoursDifference = Math.floor(minutesDifference / 60);
  if (hoursDifference === 1) return '1 hour ago';
  if (hoursDifference < 24) return `${hoursDifference} hours ago`;
  
  const daysDifference = Math.floor(hoursDifference / 24);
  if (daysDifference === 1) return '1 day ago';
  if (daysDifference < 30) return `${daysDifference} days ago`;
  
  const monthsDifference = Math.floor(daysDifference / 30);
  if (monthsDifference === 1) return '1 month ago';
  
  return `${monthsDifference} months ago`;
} 