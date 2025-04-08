import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  question: string;
  answer: string;
  answeredAt: string;
  seen: boolean;
}

interface NotificationBellProps {
  onNotificationClick: (notification: Notification) => void;
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.tickets);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: id }),
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, seen: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick(notification);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on mount and every minute
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.seen).length;

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ''}`}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 text-sm font-medium text-gray-200 border-b border-gray-700">
            Notifications
          </div>
          
          {notifications.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`px-4 py-3 hover:bg-gray-700 cursor-pointer ${notification.seen ? 'opacity-75' : 'border-l-2 border-purple-500'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between">
                  <div className="font-medium text-sm text-white mb-1 truncate">
                    {notification.question}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(notification.answeredAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {notification.answer}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 