'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State - Add User
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [role, setRole] = useState('lead');
  const [deptId, setDeptId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editRole, setEditRole] = useState('lead');
  const [editDeptId, setEditDeptId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete User State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = () => {
    fetch(`/api/admin/users?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/departments', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.departments) {
          setDepartments(data.departments);
          if (data.departments.length > 0) setDeptId(data.departments[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          regNo: regNo.trim().toUpperCase(),
          role,
          departmentId: (role === 'lead' || role === 'member') ? deptId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to provision user.');
        return;
      }

      setShowAddModal(false);
      setName('');
      setEmail('');
      setRegNo('');
      setModalError('');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Error provisioning user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRegNo(user.regNo || '');
    setEditRole(user.role || 'lead');
    setEditDeptId(user.departmentId || (departments[0]?.id || ''));
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);
    setEditError('');

    try {
      const cleanEmail = editEmail.trim().toLowerCase();
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName.trim(),
          email: cleanEmail,
          regNo: editRegNo.trim().toUpperCase(),
          role: editRole,
          departmentId: (editRole === 'lead' || editRole === 'member') ? editDeptId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update user details.');
        return;
      }

      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Error updating user.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDeleteModal = (user: any) => {
    setDeletingUser(user);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const params = new URLSearchParams();
      if (deletingUser.id) params.set('id', deletingUser.id);
      if (deletingUser.email) params.set('email', deletingUser.email);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to remove user.');
        return;
      }

      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Error removing user.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="User & Leadership Directory" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-grey pb-5">
              <div>
                <BackButton href="/admin" label="Back to Admin Dashboard" className="mb-2" />
                <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // ACCESS CONTROL &amp; ROLES
                </div>
                <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                  Chapter User &amp; Leadership Directory
                </h1>
                <p className="font-sans text-sm text-tech-grey mt-1">
                  Provision executive leadership, co-leads (equal permissions), and chapter volunteers.
                </p>
              </div>

              <button
                onClick={() => {
                  setModalError('');
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                Provision Lead / Board
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl p-6 border border-light-grey shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                    <th className="py-3 px-4 rounded-l-lg">User Profile</th>
                    <th className="py-3 px-4">Institutional Email</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Assigned Division</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-grey text-xs">
                  {users.map(u => {
                    const isSelf = session?.user?.email && u.email?.toLowerCase() === session.user.email.toLowerCase();

                    return (
                      <tr key={u.id} className="hover:bg-off-white/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img
                                alt={u.name}
                                src={u.avatarUrl}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-light-grey shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                                <span className="material-symbols-outlined text-base text-tech-grey">person</span>
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-sans font-bold text-deep-navy">
                                  {u.name}
                                </span>
                                {u.regNo && (
                                  <span className="px-1.5 py-0.5 rounded bg-electric-blue/10 border border-electric-blue/20 text-electric-blue font-mono text-[10px] font-bold">
                                    {u.regNo}
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-electric-blue/10 text-electric-blue font-mono text-[9px] font-bold uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-tech-grey">
                                {u.yearDept || 'AIC Member'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-deep-navy">
                            {u.email}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                              u.role === 'super_admin'
                                ? 'bg-deep-navy text-white'
                                : u.role === 'board'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'lead'
                                ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                                : 'bg-light-grey text-deep-navy'
                            }`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.role === 'super_admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-deep-navy/5 border border-deep-navy/15 text-deep-navy font-mono text-[11px] font-semibold">
                              <span className="material-symbols-outlined text-xs text-electric-blue">corporate_fare</span>
                              Chapter-wide (All Divisions)
                            </span>
                          ) : u.role === 'board' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px] font-semibold">
                              <span className="material-symbols-outlined text-xs text-amber-600">shield_person</span>
                              Executive Oversight
                            </span>
                          ) : (
                            <span className="font-sans font-medium text-electric-blue">
                              {u.departmentName && u.departmentName !== 'Unassigned' ? u.departmentName : 'Unassigned'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-deep-navy">
                          {u.points > 0 ? `${u.points} pts` : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit User"
                              className="p-1.5 rounded-lg text-tech-grey hover:text-electric-blue hover:bg-electric-blue/10 transition-colors inline-flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            {isSelf ? (
                              <span
                                title="Active session (You) — Self-deletion restricted"
                                className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed inline-flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenDeleteModal(u)}
                                title="Remove User"
                                className="p-1.5 rounded-lg text-tech-grey hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-electric-blue font-mono text-[10px] font-semibold uppercase tracking-wider mb-1">
                NIS-01 // PROVISIONING
              </div>
              <h3 className="font-heading text-xl font-bold text-deep-navy">
                Provision Executive User
              </h3>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-red-500">error</span>
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sen"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">VIT Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@vitstudent.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">
                  Student Registration Number <span className="text-tech-grey font-normal font-mono">(e.g. 22BCE1042)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 22BCE1042"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue uppercase font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">System Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                >
                  <option value="lead">Department Co-Lead (Equal Permissions)</option>
                  <option value="board">Executive Board Member</option>
                  <option value="member">General Member</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              {(role === 'lead' || role === 'member') ? (
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-deep-navy">Assigned Division</label>
                  <select
                    value={deptId}
                    onChange={e => setDeptId(e.target.value)}
                    className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-off-white rounded-lg border border-light-grey text-[11px] font-mono text-tech-grey flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-base">
                    {role === 'super_admin' ? 'corporate_fare' : 'shield_person'}
                  </span>
                  <span>
                    {role === 'super_admin'
                      ? 'Super Admins hold chapter-wide jurisdiction across all divisions.'
                      : 'Board members oversee all chapter departments with executive authority.'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-light-grey">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-off-white hover:bg-light-grey text-deep-navy font-sans text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {isSaving ? 'Provisioning...' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-electric-blue font-mono text-[10px] font-semibold uppercase tracking-wider mb-1">
                NIS-01 // USER MANAGEMENT
              </div>
              <h3 className="font-heading text-xl font-bold text-deep-navy">
                Edit User Details &amp; Role
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-red-500">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sen"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@vitstudent.ac.in"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">
                  Student Registration Number <span className="text-tech-grey font-normal font-mono">(e.g. 22BCE1042)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 22BCE1042"
                  value={editRegNo}
                  onChange={e => setEditRegNo(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue uppercase font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">System Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                >
                  <option value="lead">Department Co-Lead (Equal Permissions)</option>
                  <option value="board">Executive Board Member</option>
                  <option value="member">General Member</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              {(editRole === 'lead' || editRole === 'member') ? (
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-deep-navy">Assigned Division</label>
                  <select
                    value={editDeptId}
                    onChange={e => setEditDeptId(e.target.value)}
                    className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-off-white rounded-lg border border-light-grey text-[11px] font-mono text-tech-grey flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-base">
                    {editRole === 'super_admin' ? 'corporate_fare' : 'shield_person'}
                  </span>
                  <span>
                    {editRole === 'super_admin'
                      ? 'Super Admins hold chapter-wide jurisdiction across all divisions.'
                      : 'Board members oversee all chapter departments with executive authority.'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-light-grey">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-off-white hover:bg-light-grey text-deep-navy font-sans text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-red-600 font-mono text-[10px] font-semibold uppercase tracking-wider">
                  REVOCATION // PERMANENT
                </div>
                <h3 className="font-heading text-lg font-bold text-deep-navy">
                  Remove Chapter User
                </h3>
              </div>
            </div>

            <p className="text-xs text-tech-grey leading-relaxed">
              Are you sure you want to remove <strong className="text-deep-navy">{deletingUser.name}</strong> (<span className="font-mono text-deep-navy">{deletingUser.email}</span>)?
            </p>

            <div className="p-3 bg-red-50/60 rounded-lg border border-red-200/80 text-[11px] text-red-800 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-red-600 shrink-0 mt-0.5">info</span>
              <span>This action revokes immediate portal access and clears associated user records from the directory. This action cannot be undone.</span>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-500">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-light-grey">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-off-white hover:bg-light-grey text-deep-navy font-sans text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold shadow-sm transition-colors"
              >
                {isDeleting ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
