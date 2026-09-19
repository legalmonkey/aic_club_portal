'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

interface PortalOption {
  id: string;
  type: 'role' | 'venue';
  label: string;
  value: string;
  createdAt?: string;
}

export default function AdminOptionsPage() {
  const [activeTab, setActiveTab] = useState<'role' | 'venue'>('role');
  const [roleOptions, setRoleOptions] = useState<PortalOption[]>([]);
  const [venueOptions, setVenueOptions] = useState<PortalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOption, setEditingOption] = useState<PortalOption | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOption, setDeletingOption] = useState<PortalOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchOptions = async () => {
    try {
      const res = await fetch(`/api/options?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRoleOptions(data.roleOptions || []);
        setVenueOptions(data.venueOptions || []);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setIsAdding(true);
    setAddError('');

    try {
      const res = await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          label: newLabel.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add option.');
        return;
      }

      setShowAddModal(false);
      setNewLabel('');
      fetchOptions();
    } catch (err: any) {
      setAddError(err.message || 'Error adding option.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (opt: PortalOption) => {
    setEditingOption(opt);
    setEditLabel(opt.label);
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption || !editLabel.trim()) return;

    setIsEditing(true);
    setEditError('');

    try {
      const res = await fetch('/api/options', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOption.id,
          label: editLabel.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update option.');
        return;
      }

      setShowEditModal(false);
      setEditingOption(null);
      fetchOptions();
    } catch (err: any) {
      setEditError(err.message || 'Error updating option.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleOpenDelete = (opt: PortalOption) => {
    setDeletingOption(opt);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOption) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/options?id=${deletingOption.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete option.');
        return;
      }

      setShowDeleteModal(false);
      setDeletingOption(null);
      fetchOptions();
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting option.');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentList = activeTab === 'role' ? roleOptions : venueOptions;
  const filteredList = currentList.filter(o =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Shift Dropdowns & Campus Venues" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-6 max-w-6xl mx-auto">
            {/* Top Header */}
            <div>
              <BackButton href="/admin" label="Back to Super Admin" className="mb-2" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                    NIS-01 // FORM CONTROLS CONFIGURATION
                  </div>
                  <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                    Shift Roles &amp; Campus Venues
                  </h1>
                  <p className="font-sans text-sm text-tech-grey mt-1 max-w-2xl">
                    Configure the selectable options for student members logging their shifts. Any added or updated options update immediately across the portal.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewLabel('');
                    setAddError('');
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-electric-blue to-light-blue text-white font-heading text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Add {activeTab === 'role' ? 'Assigned Role' : 'Campus Venue'}</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs & Search Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-light-grey flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('role');
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'role'
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>Assigned Shift Roles</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      activeTab === 'role' ? 'bg-white/20 text-white' : 'bg-electric-blue/10 text-electric-blue'
                    }`}
                  >
                    {loading ? '...' : roleOptions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('venue');
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'venue'
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>Campus Venues &amp; Labs</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      activeTab === 'venue' ? 'bg-white/20 text-white' : 'bg-electric-blue/10 text-electric-blue'
                    }`}
                  >
                    {loading ? '...' : venueOptions.length}
                  </span>
                </button>
              </div>

              <div className="relative sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tech-grey text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder={`Filter ${activeTab === 'role' ? 'roles' : 'venues'}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-off-white rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Content List Card */}
            <div className="bg-white rounded-xl shadow-sm border border-light-grey overflow-hidden">
              <div className="p-4 border-b border-light-grey/60 bg-off-white/50 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-tech-grey font-bold">
                  Active {activeTab === 'role' ? 'Assigned Shift Roles' : 'Campus Venues / Labs'} ({loading ? '...' : filteredList.length})
                </span>
                <span className="font-sans text-xs text-tech-grey">
                  Used directly in Member Shift Entry dropdowns
                </span>
              </div>

              {loading ? (
                <div className="p-8 flex flex-col gap-3 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-light-grey/40 rounded-lg w-full" />
                  ))}
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-12 text-center text-tech-grey text-xs flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-tech-grey/60">rule_settings</span>
                  <span>No options found matching your query.</span>
                </div>
              ) : (
                <div className="divide-y divide-light-grey/60">
                  {filteredList.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="p-4 flex items-center justify-between hover:bg-off-white/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-tech-grey/60 w-6">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base">
                            {activeTab === 'role' ? 'badge' : 'location_on'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-sm font-semibold text-deep-navy truncate">
                            {opt.label}
                          </span>
                          <span className="font-mono text-[10px] text-tech-grey">
                            ID: {opt.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(opt)}
                          title="Edit Option"
                          className="p-2 rounded-lg text-tech-grey hover:text-electric-blue hover:bg-electric-blue/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelete(opt)}
                          title="Delete Option"
                          className="p-2 rounded-lg text-tech-grey hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informational Callout */}
            <div className="bg-white p-5 rounded-xl border border-light-grey shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">info</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-heading text-xs font-bold text-deep-navy uppercase tracking-wider">
                  How Form Dropdowns Sync
                </h4>
                <p className="font-sans text-xs text-tech-grey leading-relaxed">
                  The options listed here populate the Assigned Role dropdown and the Campus Venue datalist on the member&apos;s shift log page. The &ldquo;Other (Specify Custom Role)&rdquo; option is automatically appended at the bottom of the role selector to allow student custom inputs whenever needed.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-electric-blue font-mono text-[10px] font-semibold uppercase tracking-wider mb-1">
                NIS-01 // NEW OPTION
              </div>
              <h3 className="font-heading text-xl font-bold text-deep-navy">
                Add New {activeTab === 'role' ? 'Assigned Shift Role' : 'Campus Venue / Lab'}
              </h3>
            </div>

            <form onSubmit={handleCreateOption} className="flex flex-col gap-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-red-500">error</span>
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold text-deep-navy">
                  {activeTab === 'role' ? 'Role Title' : 'Venue / Lab Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activeTab === 'role'
                      ? 'e.g. Stage & AV Coordinator'
                      : 'e.g. Technology Tower (TT) 518'
                  }
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="bg-off-white px-3 py-2.5 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  autoFocus
                />
              </div>

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
                  disabled={isAdding}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {isAdding ? 'Adding...' : 'Add to Dropdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOption && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-electric-blue font-mono text-[10px] font-semibold uppercase tracking-wider mb-1">
                NIS-01 // EDIT OPTION
              </div>
              <h3 className="font-heading text-xl font-bold text-deep-navy">
                Edit {editingOption.type === 'role' ? 'Assigned Role' : 'Campus Venue'}
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
                <label className="font-sans text-xs font-semibold text-deep-navy">Option Label</label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="bg-off-white px-3 py-2.5 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  autoFocus
                />
              </div>

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
                  disabled={isEditing}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingOption && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-grey flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-heading text-lg font-bold text-deep-navy">
                Confirm Option Removal
              </h3>
            </div>

            <p className="font-sans text-xs text-tech-grey leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-deep-navy">&ldquo;{deletingOption.label}&rdquo;</span>? It will no longer appear as a selectable option in member shift log forms. Existing submissions with this option will be unaffected.
            </p>

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
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-sans text-xs font-bold shadow-sm hover:bg-red-700 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
