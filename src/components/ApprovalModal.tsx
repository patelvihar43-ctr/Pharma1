import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title: string;
  type: 'APPROVE' | 'REJECT';
  reason?: string;
  setReason?: (val: string) => void;
}

export default function ApprovalModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  type,
  reason,
  setReason
}: ApprovalModalProps) {
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!password) {
      setError('Password is required for confirmation');
      return;
    }
    if (type === 'REJECT' && !reason) {
      setError('Reason for rejection is mandatory');
      return;
    }
    onConfirm(password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className={`p-6 flex items-center justify-between ${type === 'APPROVE' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} />
                <h3 className="font-bold tracking-tight uppercase">Confirmation</h3>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">Action</p>
                <p className="text-lg font-bold text-black/80">{title}</p>
              </div>

              {type === 'REJECT' && setReason && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Reason for Rejection</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 min-h-[100px]"
                    placeholder="Provide a detailed reason for rejection..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40">Portal Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Enter your password to confirm"
                />
                <p className="text-[10px] text-black/40 uppercase font-bold mt-1">
                  By entering your password, you are confirming this action in the system.
                </p>
              </div>

              {error && (
                <div className="flex gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                className={`w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg ${
                  type === 'APPROVE' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
