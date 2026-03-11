import React, { useState, useEffect } from 'react';
import { User, RequestCategory, MasterData } from '../types';
import { Upload, Plus, Trash2, Info } from 'lucide-react';

interface DynamicFormProps {
  user: User;
  token: string;
  onSubmit: (category: RequestCategory, formData: any) => void;
}

export default function DynamicForm({ user, token, onSubmit }: DynamicFormProps) {
  const [category, setCategory] = useState<RequestCategory>('SAP');
  const [requestType, setRequestType] = useState('Create');
  const [systemType, setSystemType] = useState('Single Type');
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    designation: '',
    employeeCode: '',
    department: '',
    extNo: '',
    username: '',
    employmentStatus: 'Permanent',
    contractEndDate: ''
  });
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [dynamicRows, setDynamicRows] = useState<any[]>([]);

  useEffect(() => {
    // Pre-fill with user data but allow manual editing
    setFormData(prev => ({
      ...prev,
      firstName: user.full_name.split(' ')[0],
      lastName: user.full_name.split(' ').slice(1).join(' '),
      designation: user.designation,
      employeeCode: user.employee_id,
      department: user.department,
      extNo: user.ext_no,
      username: user.username
    }));
  }, [user]);

  useEffect(() => {
    fetch('/api/master-data', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setMasterData);
  }, [token]);

  const handleAddRow = () => {
    if (category === 'SAP') {
      setDynamicRows([...dynamicRows, { srNo: dynamicRows.length + 1, roleName: '', rights: { create: false, change: false, display: true } }]);
    } else if (category === 'GENERAL') {
      setDynamicRows([...dynamicRows, { drive: '', folders: '', permissions: 'Read' }]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setDynamicRows(dynamicRows.filter((_, i) => i !== index).map((row, i) => category === 'SAP' ? { ...row, srNo: i + 1 } : row));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For Password category, we don't have a specific requestType in the PDF, but we'll use 'Service Request'
    const finalRequestType = category === 'PASSWORD' ? 'Service Request' : requestType;
    onSubmit(category, { ...formData, requestType: finalRequestType, systemType, dynamicRows });
  };

  const renderCategoryFields = () => {
    switch (category) {
      case 'SAP':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">First Name</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Last Name</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Designation</label>
                <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employee Code</label>
                <input type="text" value={formData.employeeCode} onChange={e => setFormData({...formData, employeeCode: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Department / Section</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Ext. No.</label>
                <input type="text" value={formData.extNo} onChange={e => setFormData({...formData, extNo: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employment Status</label>
                <select 
                  value={formData.employmentStatus} 
                  onChange={e => setFormData({...formData, employmentStatus: e.target.value})} 
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              {formData.employmentStatus === 'Temporary' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40">Contract End Date</label>
                  <input 
                    type="date" 
                    value={formData.contractEndDate} 
                    onChange={e => setFormData({...formData, contractEndDate: e.target.value})} 
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" 
                    required={formData.employmentStatus === 'Temporary'}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-tight text-black/60">Roles or Transaction required</h3>
                <button type="button" onClick={handleAddRow} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <Plus size={14} /> Add Role
                </button>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-black/5">
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40 w-16">Sr. No.</th>
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40">Transaction / Role name</th>
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40">Rights (Multiple Selection)</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {dynamicRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-xs font-mono">{row.srNo}</td>
                      <td className="py-3 pr-4">
                        <input type="text" value={row.roleName} onChange={e => {
                          const newRows = [...dynamicRows];
                          newRows[idx].roleName = e.target.value;
                          setDynamicRows(newRows);
                        }} className="w-full bg-[#F9F9F9] border border-black/5 rounded-lg px-3 py-2 text-sm" placeholder="Role Name" />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-3">
                          {['create', 'change', 'display'].map(right => (
                            <label key={right} className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={row.rights[right]} 
                                onChange={e => {
                                  const newRows = [...dynamicRows];
                                  newRows[idx].rights[right] = e.target.checked;
                                  setDynamicRows(newRows);
                                }}
                                className="w-3 h-3 accent-emerald-500"
                              />
                              <span className="text-[10px] uppercase font-bold text-black/60">{right}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => handleRemoveRow(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-black/40 italic">Note: Attach Name of role number with this form if more space required.</p>
            </div>
          </div>
        );

      case 'INSTRUMENT':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">First Name</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Last Name</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employee ID</label>
                <input type="text" value={formData.employeeCode} onChange={e => setFormData({...formData, employeeCode: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Designation</label>
                <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Department</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Ext. No.</label>
                <input type="text" value={formData.extNo} onChange={e => setFormData({...formData, extNo: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employment Status</label>
                <select 
                  value={formData.employmentStatus} 
                  onChange={e => setFormData({...formData, employmentStatus: e.target.value})} 
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              {formData.employmentStatus === 'Temporary' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40">Contract End Date</label>
                  <input 
                    type="date" 
                    value={formData.contractEndDate} 
                    onChange={e => setFormData({...formData, contractEndDate: e.target.value})} 
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" 
                    required={formData.employmentStatus === 'Temporary'}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-black/40">Training Record / Module No.</label>
              <input type="text" value={formData.trainingRecord || ''} onChange={e => setFormData({...formData, trainingRecord: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" placeholder="Applicable for create/modify only" />
              <p className="text-[9px] text-black/40 italic">Note:- Training record/module number applicable for create/modify only.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Instrument/Equipment ID</label>
                <select value={formData.instrumentId || ''} onChange={e => setFormData({...formData, instrumentId: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm">
                  <option value="">Select Instrument</option>
                  {masterData.filter(d => d.type === 'INSTRUMENT').map(d => <option key={d.id} value={d.value}>{d.value}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Software/Application Name</label>
                <select value={formData.softwareName || ''} onChange={e => setFormData({...formData, softwareName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm">
                  <option value="">Select Software</option>
                  {masterData.filter(d => d.type === 'SOFTWARE').map(d => <option key={d.id} value={d.value}>{d.value}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-black/40">User Access Role/Level</label>
              <input type="text" value={formData.accessLevel || ''} onChange={e => setFormData({...formData, accessLevel: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
            </div>
          </div>
        );

      case 'GENERAL':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">First Name</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Last Name</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Designation</label>
                <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Emp Code</label>
                <input type="text" value={formData.employeeCode} onChange={e => setFormData({...formData, employeeCode: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Department</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Ext. No.</label>
                <input type="text" value={formData.extNo} onChange={e => setFormData({...formData, extNo: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employment Status</label>
                <select 
                  value={formData.employmentStatus} 
                  onChange={e => setFormData({...formData, employmentStatus: e.target.value})} 
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              {formData.employmentStatus === 'Temporary' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40">Contract End Date</label>
                  <input 
                    type="date" 
                    value={formData.contractEndDate} 
                    onChange={e => setFormData({...formData, contractEndDate: e.target.value})} 
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" 
                    required={formData.employmentStatus === 'Temporary'}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-black/40">New Computer/Laptop</label>
              <div className="flex gap-6 p-4 bg-[#F9F9F9] rounded-2xl border border-black/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="newHardware" value="Yes" checked={formData.newHardware === 'Yes'} onChange={e => setFormData({...formData, newHardware: e.target.value})} className="accent-emerald-500" required />
                  <span className="text-sm font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="newHardware" value="No" checked={formData.newHardware === 'No'} onChange={e => setFormData({...formData, newHardware: e.target.value})} className="accent-emerald-500" />
                  <span className="text-sm font-medium">No</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">User Login ID</label>
                <input type="text" value={formData.loginId || ''} onChange={e => setFormData({...formData, loginId: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">User type / Group</label>
                <input type="text" value={formData.userGroup || ''} onChange={e => setFormData({...formData, userGroup: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-tight text-black/60">Access on File Server</h3>
                <button type="button" onClick={handleAddRow} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <Plus size={14} /> Add Access
                </button>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-black/5">
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40">Drive</th>
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40">Folder(s)</th>
                    <th className="py-2 text-[10px] uppercase tracking-widest text-black/40">Read/Write/Modify</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {dynamicRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-4">
                        <input type="text" value={row.drive} onChange={e => {
                          const newRows = [...dynamicRows];
                          newRows[idx].drive = e.target.value;
                          setDynamicRows(newRows);
                        }} className="w-full bg-[#F9F9F9] border border-black/5 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Z:\" />
                      </td>
                      <td className="py-3 pr-4">
                        <input type="text" value={row.folders} onChange={e => {
                          const newRows = [...dynamicRows];
                          newRows[idx].folders = e.target.value;
                          setDynamicRows(newRows);
                        }} className="w-full bg-[#F9F9F9] border border-black/5 rounded-lg px-3 py-2 text-sm" placeholder="Folder Path" />
                      </td>
                      <td className="py-3">
                        <select value={row.permissions} onChange={e => {
                          const newRows = [...dynamicRows];
                          newRows[idx].permissions = e.target.value;
                          setDynamicRows(newRows);
                        }} className="w-full bg-[#F9F9F9] border border-black/5 rounded-lg px-3 py-2 text-sm">
                          <option>Read</option>
                          <option>Write</option>
                          <option>Modify</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => handleRemoveRow(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'PASSWORD':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Username</label>
                <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employee ID</label>
                <input type="text" value={formData.employeeCode} onChange={e => setFormData({...formData, employeeCode: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Department Name</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Designation</label>
                <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Application/Instrument ID</label>
                <input type="text" value={formData.appId || ''} onChange={e => setFormData({...formData, appId: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Software/Application Name</label>
                <input type="text" value={formData.softwareName || ''} onChange={e => setFormData({...formData, softwareName: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-black/40">Training Record / Module No.</label>
              <input type="text" value={formData.trainingRecord || ''} onChange={e => setFormData({...formData, trainingRecord: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-black/40">Activity</label>
              <div className="flex gap-6 p-4 bg-[#F9F9F9] rounded-2xl border border-black/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.passwordReset || false} onChange={e => setFormData({...formData, passwordReset: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium">Password Reset</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.accountUnlock || false} onChange={e => setFormData({...formData, accountUnlock: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium">Account Unlock</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-black/40">Employment Status</label>
                <select 
                  value={formData.employmentStatus} 
                  onChange={e => setFormData({...formData, employmentStatus: e.target.value})} 
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              {formData.employmentStatus === 'Temporary' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-black/40">Contract End Date</label>
                  <input 
                    type="date" 
                    value={formData.contractEndDate} 
                    onChange={e => setFormData({...formData, contractEndDate: e.target.value})} 
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm" 
                    required={formData.employmentStatus === 'Temporary'}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-black/40">Remark (If any)</label>
              <textarea value={formData.remark || ''} onChange={e => setFormData({...formData, remark: e.target.value})} className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl px-4 py-2 text-sm min-h-[80px]" />
            </div>
            
            <p className="text-[10px] text-black/40 italic">Note: There is no need to mention the IT Administrator training on equipment or instruments.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
        <div className="bg-[#151619] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                {category === 'SAP' ? 'SAP User Request Form' : 
                 category === 'INSTRUMENT' ? 'Instrument Account Management' :
                 category === 'GENERAL' ? 'User Account Management Form' :
                 'Password Management Form'}
              </h2>
              <p className="text-white/40 text-xs uppercase tracking-widest font-mono">21 CFR Part 11 Compliant</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Date</p>
              <p className="text-sm font-mono">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-black/40">Form Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as RequestCategory);
                  setDynamicRows([]);
                }}
                className="w-full bg-[#F9F9F9] border border-black/5 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="SAP">SAP User Request</option>
                <option value="INSTRUMENT">Instrument / Equipment Account</option>
                <option value="GENERAL">General User Account (Network/File Server)</option>
                <option value="PASSWORD">Password Management</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-black/40">Request Type</label>
              {category === 'PASSWORD' ? (
                <div className="w-full bg-black/5 border border-black/5 rounded-2xl px-6 py-4 text-lg font-bold text-emerald-600">
                  Service Request
                </div>
              ) : (
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value)}
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  required
                >
                  {['Create', 'Role Update', 'Modify', 'Deactivate'].map(opt => {
                    if (category === 'SAP' && opt === 'Modify') return null;
                    if (category !== 'SAP' && opt === 'Role Update') return null;
                    return <option key={opt} value={opt}>{opt}</option>;
                  })}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-black/40">System Type</label>
            <div className="flex gap-4">
              {['Single Type', 'Multi-System'].map(type => (
                <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${systemType === type ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-[#F9F9F9] border-black/5 text-black/40 hover:border-black/10'}`}>
                  <input
                    type="radio"
                    name="systemType"
                    value={type}
                    checked={systemType === type}
                    onChange={e => setSystemType(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-sm font-bold">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-black/5" />

          {renderCategoryFields()}

          <div className="pt-8 flex justify-end gap-4">
            <button type="submit" className="px-12 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              Submit Request
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
