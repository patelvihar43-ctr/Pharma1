import React, { useState, useEffect } from 'react';
import { User, MasterData, AuditLog } from '../types';
import { 
  Users, 
  Database as DbIcon, 
  History, 
  Download, 
  Plus, 
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  token: string;
  user: User;
  initialTab?: 'users' | 'master' | 'audit';
}

export default function AdminPanel({ token, user, initialTab }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'master' | 'audit'>(initialTab || 'users');
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [auditFilter]);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  
  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    employee_id: '',
    department: '',
    designation: '',
    ext_no: '',
    role: 'EMPLOYEE'
  });
  const [newMaster, setNewMaster] = useState({ type: 'SOFTWARE', value: '' });

  const fetchData = () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    if (['SUPER_ADMIN', 'IT_ADMIN'].includes(user.role)) {
      fetch('/api/admin/users', { headers }).then(res => res.json()).then(setUsers).catch(() => {});
      fetch('/api/master-data', { headers }).then(res => res.json()).then(setMasterData).catch(() => {});
    }
    fetch('/api/admin/audit-logs', { headers }).then(res => res.json()).then(setAuditLogs).catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newUser)
    });
    if (res.ok) {
      setIsUserModalOpen(false);
      setEditingUser(null);
      setNewUser({ username: '', password: '', full_name: '', employee_id: '', department: '', designation: '', ext_no: '', role: 'EMPLOYEE' });
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleAddMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/master-data', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newMaster)
    });
    if (res.ok) {
      setIsMasterModalOpen(false);
      setNewMaster({ ...newMaster, value: '' });
      fetchData();
    }
  };

  const deleteMaster = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    await fetch(`/api/admin/master-data/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const handleExportPDF = () => {
    alert('Generating PDF for auditor... (Mocked)');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {[
            { id: 'users', label: 'User Mapping', icon: Users, roles: ['IT_ADMIN', 'SUPER_ADMIN'] },
            { id: 'master', label: 'Master Data', icon: DbIcon, roles: ['IT_ADMIN', 'SUPER_ADMIN'] },
            { id: 'audit', label: 'Global Audit Trail', icon: History, roles: ['EMPLOYEE', 'HOD', 'QA', 'IT_ADMIN', 'SUPER_ADMIN'] },
          ].filter(tab => tab.roles.includes(user.role)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-[#151619] text-white shadow-lg' 
                  : 'bg-white text-black/40 hover:bg-black/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        {['SUPER_ADMIN', 'IT_ADMIN', 'QA'].includes(user.role) && (
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
          >
            <Download size={18} /> Export for Auditor
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        {activeSubTab === 'users' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold uppercase tracking-tight text-black/60">System User Matrix</h3>
              <button 
                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
              >
                <Plus size={14} /> Add User
              </button>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-black/5">
                  <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Employee ID</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Full Name</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Department</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">System Role</th>
                  <th className="py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-4 text-xs font-mono font-bold">{u.employee_id}</td>
                    <td className="py-4 text-xs font-bold">{u.full_name}</td>
                    <td className="py-4 text-xs font-medium">{u.department}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-black/5 rounded-lg text-[10px] font-bold uppercase tracking-tighter text-black/60">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => {
                          setEditingUser(u);
                          setNewUser({
                            username: u.username,
                            password: '', // Don't show password
                            full_name: u.full_name,
                            employee_id: u.employee_id,
                            department: u.department,
                            designation: u.designation || '',
                            ext_no: u.ext_no || '',
                            role: u.role
                          });
                          setIsUserModalOpen(true);
                        }}
                        className="text-black/20 hover:text-black transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'master' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold uppercase tracking-tight text-black/60">Master Data Management</h3>
              <button 
                onClick={() => setIsMasterModalOpen(true)}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
              >
                <Plus size={14} /> Add Entry
              </button>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {['SOFTWARE', 'INSTRUMENT', 'DEPARTMENT'].map(type => (
                <div key={type} className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-black/40 tracking-widest border-b border-black/5 pb-2">{type}S</h4>
                  <div className="space-y-2">
                    {masterData.filter(d => d.type === type).map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-xl border border-black/5 text-xs font-medium">
                        {d.value}
                        <button 
                          onClick={() => deleteMaster(d.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Plus size={14} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'audit' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="font-bold uppercase tracking-tight text-black/60">Immutable Audit Trail</h3>
                <select 
                  value={auditFilter}
                  onChange={e => setAuditFilter(e.target.value)}
                  className="bg-black/5 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN">Logins</option>
                  <option value="LOGOUT">Logouts</option>
                  <option value="CLICK">Clicks</option>
                  <option value="SUBMITTED">Submissions</option>
                  <option value="HOD_APPROVED">HOD Approvals</option>
                  <option value="QA_APPROVED">QA Approvals</option>
                  <option value="IT_ADMIN_APPROVED">IT Approvals</option>
                  <option value="REJECTED">Rejections</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">No Deletions Allowed</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-black/5">
                    <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Timestamp</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">User</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Action</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">Details</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-black/40">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(() => {
                    const filteredLogs = auditLogs.filter(log => auditFilter === 'ALL' || log.action.includes(auditFilter));
                    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

                    return (
                      <>
                        {paginatedLogs.map(log => (
                          <tr key={log.id} className="hover:bg-black/5 transition-colors">
                            <td className="py-4 text-xs font-mono text-black/40 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-4 text-xs font-bold whitespace-nowrap">{log.full_name}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                                log.action === 'LOGIN' ? 'bg-emerald-50 text-emerald-600' :
                                log.action === 'LOGOUT' ? 'bg-orange-50 text-orange-600' :
                                log.action === 'CLICK' ? 'bg-blue-50 text-blue-600' :
                                'bg-black/5 text-black/60'
                              }`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-4 text-xs text-black/80 max-w-xs truncate" title={log.details || log.justification}>
                              {log.details || log.justification || '-'}
                            </td>
                            <td className="py-4 text-xs font-mono text-black/40">{log.ip_address}</td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-xs text-black/40 italic">No audit logs found for this filter</td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const filteredLogs = auditLogs.filter(log => auditFilter === 'ALL' || log.action.includes(auditFilter));
              const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
              if (totalPages <= 1) return null;

              return (
                <div className="p-6 border-t border-black/5 flex items-center justify-between bg-[#F9F9F9]">
                  <div className="text-[10px] uppercase font-bold text-black/40 tracking-widest">
                    Showing {Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredLogs.length, currentPage * itemsPerPage)} of {filteredLogs.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                    >
                      First
                    </button>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                    >
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, start + maxVisible - 1);
                        
                        if (end - start + 1 < maxVisible) {
                          start = Math.max(1, end - maxVisible + 1);
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                                currentPage === i 
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                  : 'bg-white text-black/40 border border-black/5 hover:bg-black/5'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                    >
                      Next
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                    >
                      Last
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-10">
              <h2 className="text-2xl font-bold tracking-tight mb-8">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <form onSubmit={handleAddUser} className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Username</label>
                  <input 
                    disabled={!!editingUser}
                    type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Password</label>
                    <input 
                      type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Full Name</label>
                  <input 
                    type="text" required value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Employee ID</label>
                  <input 
                    type="text" required value={newUser.employee_id} onChange={e => setNewUser({...newUser, employee_id: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Department</label>
                  <select 
                    value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select Dept</option>
                    {masterData.filter(d => d.type === 'DEPARTMENT').map(d => <option key={d.id} value={d.value}>{d.value}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Role</label>
                  <select 
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HOD">HOD</option>
                    <option value="QA">QA</option>
                    <option value="IT_ADMIN">IT ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Designation</label>
                  <input 
                    type="text" required value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Ext. No.</label>
                  <input 
                    type="text" required value={newUser.ext_no} onChange={e => setNewUser({...newUser, ext_no: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="col-span-2 flex gap-4 mt-6">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20">{editingUser ? 'Update User' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Master Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-10">
              <h2 className="text-2xl font-bold tracking-tight mb-8">Add Master Entry</h2>
              <form onSubmit={handleAddMaster} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Type</label>
                  <select 
                    value={newMaster.type} onChange={e => setNewMaster({...newMaster, type: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INSTRUMENT">INSTRUMENT</option>
                    <option value="DEPARTMENT">DEPARTMENT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40 ml-2">Value</label>
                  <input 
                    type="text" required value={newMaster.value} onChange={e => setNewMaster({...newMaster, value: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter value..."
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setIsMasterModalOpen(false)} className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20">Add Entry</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
