import React, { useState, useEffect } from 'react';
import { ITRequest, User, RequestStatus } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Search,
  Filter,
  Eye
} from 'lucide-react';

interface DashboardProps {
  user: User;
  token: string;
  onViewRequest: (req: ITRequest) => void;
  showOnlyPending?: boolean;
}

export default function Dashboard({ user, token, onViewRequest, showOnlyPending }: DashboardProps) {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showOnlyPending]);

  useEffect(() => {
    fetch('/api/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (showOnlyPending) {
          filtered = data.filter((r: ITRequest) => r.status.includes('PENDING'));
        }
        setRequests(filtered);
        setLoading(false);
      });
  }, [token, showOnlyPending]);

  const getWorkflowStage = (status: RequestStatus) => {
    const stages: Record<RequestStatus, string> = {
      DRAFT: 'Submission',
      SUBMITTED_PENDING_HOD: 'HOD Approval',
      APPROVED_PENDING_QA: 'QA Verification',
      APPROVED_PENDING_IT: 'IT Execution',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected'
    };
    return stages[status];
  };

  const getStatusBadge = (status: RequestStatus) => {
    const styles: Record<RequestStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      SUBMITTED_PENDING_HOD: 'bg-blue-100 text-blue-600',
      APPROVED_PENDING_QA: 'bg-amber-100 text-amber-600',
      APPROVED_PENDING_IT: 'bg-purple-100 text-purple-600',
      COMPLETED: 'bg-emerald-100 text-emerald-600',
      REJECTED: 'bg-red-100 text-red-600'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${styles[status]}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const stats = [
    { label: 'Total Requests', value: requests.length, icon: Clock, color: 'text-blue-500' },
    { label: 'Pending Action', value: requests.filter(r => r.status.includes('PENDING')).length, icon: Filter, color: 'text-amber-500' },
    { label: 'Completed', value: requests.filter(r => r.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Rejected', value: requests.filter(r => r.status === 'REJECTED').length, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-black/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter mb-1">{stat.value}</p>
            <p className="text-xs font-bold text-black/40 uppercase tracking-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="font-bold uppercase tracking-tight text-black/60">Recent IT Requests</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={14} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#F9F9F9] border border-black/5 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left bg-[#F9F9F9] border-b border-black/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">ID</th>
                {user.role !== 'EMPLOYEE' && <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">Employee</th>}
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">Current Stage</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-black/40">Last Updated</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={user.role !== 'EMPLOYEE' ? 7 : 6} className="px-6 py-12 text-center text-xs text-black/40 uppercase font-bold">Loading requests...</td>
                </tr>
              ) : (() => {
                const filtered = requests.filter(r => 
                  r.id.toString().includes(searchQuery) || 
                  r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.status.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                const totalPages = Math.ceil(filtered.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={user.role !== 'EMPLOYEE' ? 7 : 6} className="px-6 py-12 text-center text-xs text-black/40 uppercase font-bold">No requests found</td>
                    </tr>
                  );
                }

                return (
                  <>
                    {paginated.map((req) => (
                      <tr key={req.id} className="hover:bg-black/5 transition-colors group cursor-pointer" onClick={() => onViewRequest(req)}>
                        <td className="px-6 py-4 text-xs font-mono font-bold">#{req.id.toString().padStart(4, '0')}</td>
                        {user.role !== 'EMPLOYEE' && (
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold">{req.employee_name}</p>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium">{req.category.replace(/_/g, ' ')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs font-bold text-black/60">{getWorkflowStage(req.status)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-xs text-black/40 font-medium">
                          {new Date(req.last_updated).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight size={16} className="text-black/20 group-hover:text-emerald-500 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(() => {
          const filtered = requests.filter(r => 
            r.id.toString().includes(searchQuery) || 
            r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.status.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          if (totalPages <= 1) return null;

          return (
            <div className="p-6 border-t border-black/5 flex items-center justify-between bg-[#F9F9F9]">
              <div className="text-[10px] uppercase font-bold text-black/40 tracking-widest">
                Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(pageNum); }}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                          currentPage === pageNum 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-white text-black/40 border border-black/5 hover:bg-black/5'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-black/5 disabled:opacity-30 hover:bg-black/5 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
