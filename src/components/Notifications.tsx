import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle } from 'lucide-react';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsProps {
  token: string;
}

export default function Notifications({ token }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-black/5 transition-colors text-black/60 hover:text-black"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-black/5 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 flex justify-between items-center bg-[#F9F9F9]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-black/60">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-black/20 hover:text-black">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-black/20 font-medium italic">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 transition-colors ${notification.read ? 'bg-white' : 'bg-emerald-50/30'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            notification.type === 'EXPIRY_WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {notification.type === 'EXPIRY_WARNING' ? <AlertTriangle size={16} /> : <Bell size={16} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className={`text-xs leading-relaxed ${notification.read ? 'text-black/60' : 'text-black font-medium'}`}>
                              {notification.message}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-black/30 font-mono">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                              {!notification.read && (
                                <button 
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                  <Check size={10} /> Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 bg-[#F9F9F9] border-t border-black/5 text-center">
                  <button className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black">
                    View All Activity
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
