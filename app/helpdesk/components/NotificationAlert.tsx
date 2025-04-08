import React, { useState, useEffect } from 'react';
import { 
  BellAlertIcon, 
  ExclamationCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface NotificationAlertProps {
  newTicketsCount: number;
  escalatedTicketsCount: number;
  onViewNewTickets: () => void;
  onViewEscalated: () => void;
  lastChecked: Date;
}

export default function NotificationAlert({
  newTicketsCount,
  escalatedTicketsCount,
  onViewNewTickets,
  onViewEscalated,
  lastChecked
}: NotificationAlertProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<{ message: string; timestamp: Date }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Show notification when props change
  useEffect(() => {
    if (newTicketsCount > 0 || escalatedTicketsCount > 0) {
      setShowNotification(true);
      
      // Add to notification history
      const now = new Date();
      if (newTicketsCount > 0) {
        setNotificationHistory(prev => [
          { 
            message: `${newTicketsCount} new ticket${newTicketsCount > 1 ? 's' : ''} received`, 
            timestamp: now 
          },
          ...prev.slice(0, 9) // Keep only the 10 most recent notifications
        ]);
      }
      
      if (escalatedTicketsCount > 0) {
        setNotificationHistory(prev => [
          { 
            message: `${escalatedTicketsCount} ticket${escalatedTicketsCount > 1 ? 's' : ''} escalated`, 
            timestamp: now 
          },
          ...prev.slice(0, 9) // Keep only the 10 most recent notifications
        ]);
      }
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [newTicketsCount, escalatedTicketsCount]);
  
  // Format time passed since last checked
  const getTimeAgo = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };
  
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col items-end">
      {/* Bell icon with notification count */}
      <div className="relative">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors text-white relative"
        >
          <BellAlertIcon className={`w-6 h-6 ${notificationHistory.length > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
          {notificationHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notificationHistory.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Notification popup */}
      {showNotification && (
        <div className="mt-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-72 overflow-hidden animate-slideInRight">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium flex items-center gap-2">
              <BellAlertIcon className="w-5 h-5 text-yellow-400" />
              New Alerts
            </h3>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-3">
            {newTicketsCount > 0 && (
              <div className="mb-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <p className="text-blue-300 font-medium">
                  {newTicketsCount} new ticket{newTicketsCount > 1 ? 's' : ''}
                </p>
                <button
                  onClick={onViewNewTickets}
                  className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View now →
                </button>
              </div>
            )}
            
            {escalatedTicketsCount > 0 && (
              <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                <p className="text-red-300 font-medium flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {escalatedTicketsCount} escalated ticket{escalatedTicketsCount > 1 ? 's' : ''}
                </p>
                <button
                  onClick={onViewEscalated}
                  className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  View urgent →
                </button>
              </div>
            )}
          </div>
          
          <div className="p-2 bg-gray-700/30 text-xs text-gray-400 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            <span>Last checked: {getTimeAgo()}</span>
          </div>
        </div>
      )}
      
      {/* Notification history */}
      {showHistory && (
        <div className="mt-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-72 overflow-hidden animate-slideInRight">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Notification History</h3>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {notificationHistory.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {notificationHistory.map((notification, index) => (
                  <li key={index} className="p-3 hover:bg-gray-700/30">
                    <p className="text-white text-sm">{notification.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {notification.timestamp.toLocaleTimeString()} - {notification.timestamp.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-400">
                No recent notifications
              </div>
            )}
          </div>
          
          <div className="p-2 bg-gray-700/30 text-xs text-gray-400 flex justify-between">
            <span>Keep for 24 hours</span>
            {notificationHistory.length > 0 && (
              <button 
                onClick={() => setNotificationHistory([])}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 