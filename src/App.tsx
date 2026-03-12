import React, { useState, useEffect } from 'react';
import { ITRequest, User } from './types';
import Layout from './components/Layout';
import DynamicForm from './components/DynamicForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import ApprovalModal from './components/ApprovalModal';
import { 
  Activity, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  ShieldAlert,
  XCircle,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pharma_token'));
  const [activeTab, setActiveTab] = useState(localStorage.getItem('pharma_active_tab') || 'dashboard');

  useEffect(() => {
    localStorage.setItem('pharma_active_tab', activeTab);
  }, [activeTab]);

  const [selectedRequest, setSelectedRequest] = useState<ITRequest | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalType, setApprovalType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [itClosureData, setItClosureData] = useState({
    authProvided: 'Yes',
    loginId: '',
    remarks: ''
  });

  useEffect(() => {
    if (token && !user) {
      fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Session expired');
      })
      .then(userData => setUser(userData))
      .catch(() => {
        localStorage.removeItem('pharma_token');
        setToken(null);
      });
    }
  }, [token, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      if (res.ok) {
        const { user: userData, token: jwtToken } = await res.json();
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('pharma_token', jwtToken);
      } else if (res.status === 401) {
        setLoginError('Invalid username or password');
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'System error. Please contact IT support.');
        setLoginError(errorMessage);
      }
    } catch (err) {
      setLoginError('Network error. Check your connection.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('pharma_token');
  };

  const handleNewRequest = async (category: any, formData: any) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user?.id, category, formData }),
      });
      if (res.ok) {
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovalAction = async (password: string) => {
    if (!selectedRequest || !user) return;

    const endpoint = approvalType === 'APPROVE' ? 'approve' : 'reject';
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          role: user.role, 
          password,
          reason: rejectionReason,
          itClosureData: user.role === 'IT_ADMIN' && approvalType === 'APPROVE' ? itClosureData : undefined
        }),
      });
      if (res.ok) {
        setIsApprovalModalOpen(false);
        setSelectedRequest(null);
        setActiveTab('dashboard');
      } else {
        alert('Invalid password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6 font-sans">
        {/* Background Accents */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white border border-black/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
            {/* System Status Indicator */}
            <div className="absolute top-6 right-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">System Online</span>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                <Activity size={32} />
              </div>
              <h1 className="text-3xl font-bold text-black tracking-tight mb-2">PharmaFlow</h1>
              <p className="text-black/40 text-[10px] uppercase tracking-[0.2em] font-mono">Secure IT Portal Access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-black/40 tracking-widest ml-4">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-2xl pl-14 pr-6 py-4 text-black focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="Enter your ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-black/40 tracking-widest ml-4">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-2xl pl-14 pr-6 py-4 text-black focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  {loginError}
                </div>
              )}

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-3 h-3 accent-emerald-500 rounded border-black/10" id="remember" />
                  <label htmlFor="remember" className="text-[10px] uppercase font-bold text-black/40 tracking-tight cursor-pointer">Remember Me</label>
                </div>
                <button type="button" className="text-[10px] uppercase font-bold text-emerald-600 tracking-tight hover:underline">Forgot Password?</button>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                Sign In to Portal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-black/5 text-center">
              <p className="text-[10px] text-black/20 uppercase font-bold tracking-widest mb-4">Authorized Personnel Only</p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1 text-[9px] text-black/40 font-bold uppercase">
                  <ShieldAlert size={10} /> 21 CFR Part 11
                </div>
                <div className="flex items-center gap-1 text-[9px] text-black/40 font-bold uppercase">
                  <CheckCircle size={10} /> Audit Ready
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center mt-8 text-black/20 text-[10px] font-mono uppercase tracking-widest">
            System Version 4.2.0-LTS | PharmaFlow Enterprise
          </p>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    if (selectedRequest) {
      const formData = JSON.parse(selectedRequest.form_data);
      const isPendingMyAction = 
        (user.role === 'HOD' && selectedRequest.status === 'SUBMITTED_PENDING_HOD') ||
        (user.role === 'QA' && selectedRequest.status === 'APPROVED_PENDING_QA') ||
        (user.role === 'IT_ADMIN' && selectedRequest.status === 'APPROVED_PENDING_IT');

      return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          <button 
            onClick={() => setSelectedRequest(null)}
            className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden">
            <div className="bg-white p-10 text-black border-b border-black/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                    Request #{selectedRequest.id.toString().padStart(4, '0')}
                  </span>
                  <span className="px-3 py-1 bg-black/5 text-black/60 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {selectedRequest.category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">{selectedRequest.employee_name}</h2>
                <p className="text-black/40 text-xs font-mono uppercase tracking-widest">Submitted on {new Date(selectedRequest.submission_date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-black/40 mb-2 tracking-widest">Current Status</p>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-bold uppercase tracking-tight">
                  {selectedRequest.status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Workflow Tracker */}
            <div className="px-10 py-8 bg-[#F9F9F9] border-b border-black/5">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 -translate-y-1/2 z-0" />
                {[
                  { id: 'SUBMITTED', label: 'Submission', status: ['SUBMITTED_PENDING_HOD', 'APPROVED_PENDING_QA', 'APPROVED_PENDING_IT', 'COMPLETED'] },
                  { id: 'HOD', label: 'HOD Approval', status: ['APPROVED_PENDING_QA', 'APPROVED_PENDING_IT', 'COMPLETED'] },
                  { id: 'QA', label: 'QA Verification', status: ['APPROVED_PENDING_IT', 'COMPLETED'] },
                  { id: 'IT', label: 'IT Execution', status: ['COMPLETED'] },
                ].map((step, idx) => {
                  const isCompleted = step.status.includes(selectedRequest.status);
                  const isCurrent = (idx === 0 && selectedRequest.status === 'SUBMITTED_PENDING_HOD') ||
                                  (idx === 1 && selectedRequest.status === 'APPROVED_PENDING_QA') ||
                                  (idx === 2 && selectedRequest.status === 'APPROVED_PENDING_IT');
                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                        isCurrent ? 'bg-white border-emerald-500 text-emerald-500 animate-pulse shadow-lg shadow-emerald-500/20' : 
                        'bg-white border-black/10 text-black/20'
                      }`}>
                        {isCompleted ? <CheckCircle size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-tighter ${
                        isCompleted || isCurrent ? 'text-black' : 'text-black/20'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-10 space-y-12">
              <section className="space-y-6">
                <h3 className="text-[10px] uppercase font-bold text-black/40 tracking-[0.2em] border-b border-black/5 pb-4 flex items-center gap-2">
                  <FileText size={14} /> Requester Information
                </h3>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Full Name</p>
                    <p className="text-sm font-bold text-black/80">{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Employee ID</p>
                    <p className="text-sm font-mono font-bold text-black/80">{formData.employeeCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Designation</p>
                    <p className="text-sm font-bold text-black/80">{formData.designation}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Department</p>
                    <p className="text-sm font-bold text-black/80">{formData.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Ext. No.</p>
                    <p className="text-sm font-bold text-black/80">{formData.extNo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-black/40">Request Type</p>
                    <p className="text-sm font-bold text-emerald-600">{formData.requestType}</p>
                  </div>
                  {formData.systemType && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-black/40">System Type</p>
                      <p className="text-sm font-bold text-emerald-600">{formData.systemType}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] uppercase font-bold text-black/40 tracking-[0.2em] border-b border-black/5 pb-4 flex items-center gap-2">
                  <Activity size={14} /> Form Specific Details
                </h3>
                <div className="grid grid-cols-2 gap-10">
                  {Object.entries(formData).map(([key, val]: any) => {
                    if (['firstName', 'lastName', 'designation', 'employeeCode', 'department', 'extNo', 'requestType', 'systemType', 'dynamicRows', 'instrumentRows'].includes(key)) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-black/40">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</p>
                        <p className="text-sm font-bold text-black/80">{val === true ? 'YES' : val === false ? 'NO' : val || 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
                {formData.dynamicRows && formData.dynamicRows.length > 0 && (
                  <div className="mt-8 bg-[#F9F9F9] rounded-3xl p-6 border border-black/5">
                    <h4 className="text-[10px] uppercase font-bold text-black/40 mb-4 tracking-widest">Dynamic Entries</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-black/10">
                          {Object.keys(formData.dynamicRows[0]).map(k => (
                            <th key={k} className="py-3 text-[10px] uppercase font-bold text-black/40">{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.dynamicRows.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-black/5 last:border-0">
                            {Object.entries(row).map(([k, v]: any) => (
                              <td key={k} className="py-4 text-xs font-bold text-black/80">
                                {typeof v === 'object' ? 
                                  Object.entries(v).filter(([_, val]) => val).map(([key]) => key).join(', ').toUpperCase() : 
                                  v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {formData.instrumentRows && formData.instrumentRows.length > 0 && (
                  <div className="mt-8 bg-[#F9F9F9] rounded-3xl p-6 border border-black/5">
                    <h4 className="text-[10px] uppercase font-bold text-black/40 mb-4 tracking-widest">Instrument Entries</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-black/10">
                          <th className="py-3 text-[10px] uppercase font-bold text-black/40">Software Name</th>
                          <th className="py-3 text-[10px] uppercase font-bold text-black/40">Instrument ID</th>
                          <th className="py-3 text-[10px] uppercase font-bold text-black/40">Access Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.instrumentRows.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-black/5 last:border-0">
                            <td className="py-4 text-xs font-bold text-black/80">{row.softwareName}</td>
                            <td className="py-4 text-xs font-bold text-black/80">{row.instrumentId}</td>
                            <td className="py-4 text-xs font-bold text-black/80">
                              {Object.entries(row.accessLevel).filter(([_, val]) => val).map(([key]) => key).join(', ').toUpperCase()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* IT Closure Data View (If completed) */}
              {selectedRequest.it_closure_data && (
                <section className="space-y-6 p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-100">
                  <h3 className="text-[10px] uppercase font-bold text-emerald-700 tracking-[0.2em] border-b border-emerald-200 pb-4 flex items-center gap-2">
                    <Settings size={14} /> IT / System Administrator Completion Details
                  </h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-emerald-700/60">Authorization Provided</p>
                      <p className="text-sm font-bold text-black/80">{JSON.parse(selectedRequest.it_closure_data).authProvided}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-emerald-700/60">User Login ID / NT Username</p>
                      <p className="text-sm font-bold text-black/80">{JSON.parse(selectedRequest.it_closure_data).loginId || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-emerald-700/60">Remarks / Group Memberships</p>
                      <p className="text-sm font-bold text-black/80">{JSON.parse(selectedRequest.it_closure_data).remarks || 'N/A'}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* IT Execution Section - Only for IT Admin during execution stage */}
              {user.role === 'IT_ADMIN' && selectedRequest.status === 'APPROVED_PENDING_IT' && (
                <section className="space-y-6 p-8 bg-emerald-50 rounded-[32px] border border-emerald-100">
                  <h3 className="text-[10px] uppercase font-bold text-emerald-700 tracking-[0.2em] border-b border-emerald-200 pb-4 flex items-center gap-2">
                    <Settings size={14} /> To be completed by IT / System Administrator
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {selectedRequest.category !== 'PASSWORD' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-emerald-700/60">Authorization Provided</label>
                          <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="itAuth" 
                                value="Yes" 
                                checked={itClosureData.authProvided === 'Yes'}
                                onChange={e => setItClosureData({...itClosureData, authProvided: e.target.value})}
                                className="accent-emerald-500" 
                              />
                              <span className="text-xs font-bold">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="itAuth" 
                                value="No" 
                                checked={itClosureData.authProvided === 'No'}
                                onChange={e => setItClosureData({...itClosureData, authProvided: e.target.value})}
                                className="accent-emerald-500" 
                              />
                              <span className="text-xs font-bold">No</span>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-emerald-700/60">
                            {selectedRequest.category === 'SAP' ? 'User Login ID' : 
                             selectedRequest.category === 'INSTRUMENT' ? 'Application Username/User ID' : 
                             'Active Directory (NT) Username'}
                          </label>
                          <input 
                            type="text" 
                            value={itClosureData.loginId}
                            onChange={e => setItClosureData({...itClosureData, loginId: e.target.value})}
                            className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" 
                            placeholder="e.g. jdoe01" 
                          />
                        </div>
                      </>
                    )}
                    <div className={`${selectedRequest.category === 'PASSWORD' ? 'col-span-2' : 'col-span-2'} space-y-1`}>
                      <label className="text-[10px] uppercase font-bold text-emerald-700/60">
                        {selectedRequest.category === 'SAP' ? 'Remarks' : 
                         selectedRequest.category === 'INSTRUMENT' ? 'Remarks' : 
                         selectedRequest.category === 'GENERAL' ? 'Active Directory Group Membership(s)' : 
                         'Comment (If any)'}
                      </label>
                      <textarea 
                        value={itClosureData.remarks}
                        onChange={e => setItClosureData({...itClosureData, remarks: e.target.value})}
                        className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]" 
                        placeholder="Enter execution details..." 
                      />
                    </div>
                  </div>
                </section>
              )}

              {isPendingMyAction && (
                <div className="pt-10 border-t border-black/5 flex gap-4">
                  <button 
                    onClick={() => { setApprovalType('REJECT'); setIsApprovalModalOpen(true); }}
                    className="flex-1 py-4 bg-white border border-red-500/30 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
                  >
                    Reject Request
                  </button>
                  <button 
                    onClick={() => { setApprovalType('APPROVE'); setIsApprovalModalOpen(true); }}
                    className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={18} /> Approve & Sign
                  </button>
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && (
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex gap-4">
                  <XCircle className="text-red-500 shrink-0" size={24} />
                  <div>
                    <p className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-800">{selectedRequest.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} token={token!} onViewRequest={setSelectedRequest} />;
      case 'new-request': return <DynamicForm user={user} token={token!} onSubmit={handleNewRequest} />;
      case 'approvals': return <Dashboard user={user} token={token!} onViewRequest={setSelectedRequest} showOnlyPending />;
      case 'audit': return <AdminPanel token={token!} user={user} initialTab="audit" />;
      case 'admin': return <AdminPanel token={token!} user={user} initialTab="users" />;
      default: return <Dashboard user={user} token={token!} onViewRequest={setSelectedRequest} />;
    }
  };

  return (
    <>
      <Layout 
        user={user!} 
        token={token!}
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      >
        {renderContent()}
      </Layout>

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirm={handleApprovalAction}
        title={approvalType === 'APPROVE' ? `Approve ${selectedRequest?.category} Request` : `Reject ${selectedRequest?.category} Request`}
        type={approvalType}
        reason={rejectionReason}
        setReason={setRejectionReason}
      />
    </>
  );
}
