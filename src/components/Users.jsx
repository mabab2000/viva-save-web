import { useState, useRef, useEffect } from 'react';
import { useToast } from './Toast';

const mockUsers = [
  { id: 'local-1', name: 'John Doe', email: 'john@example.com', phone: '250785867436', status: 'Active' },
  { id: 'local-2', name: 'Jane Smith', email: 'jane@example.com', phone: '250785867437', status: 'Inactive' },
];

const Users = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'Active', password: '', confirm_password: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Add Saving modal states
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [savingTargetUser, setSavingTargetUser] = useState(null);
  const [savingAmount, setSavingAmount] = useState('');
  const [savingLoading, setSavingLoading] = useState(false);
  // Add Penalty modal states
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyTargetUser, setPenaltyTargetUser] = useState(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  // Add Loan modal states
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanTargetUser, setLoanTargetUser] = useState(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanIssuedDate, setLoanIssuedDate] = useState('');
  const [loanDeadline, setLoanDeadline] = useState('');
  const [loanLoading, setLoanLoading] = useState(false);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  // Fetch users from API
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://saving-api.mababa.app/api/users', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (aborted) return;
        // transform API response to UI shape: { id, name, email, phone, status }
        const transformed = data.map(u => ({
          id: u.id,
          name: u.username || u.name || '',
          email: u.email || '',
          phone: u.phone_number || u.phone || '',
          status: 'Active',
          // API may return total_saving as part of user object
          total_saving: typeof u.total_saving !== 'undefined' ? u.total_saving : null
        }));
        setUsers(transformed);
      } catch (err) {
        if (err.name === 'AbortError') return;
        // fallback to mock data on error
        setError(err.message || 'Failed to load users');
        setUsers(mockUsers);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchUsers();
    return () => { aborted = true; controller.abort(); };
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );
  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  const openAddModal = () => {
    setEditId(null);
    setFormData({ name: '', email: '', phone: '', status: 'Active', password: '', confirm_password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (id) => {
    const user = users.find(u => u.id === id);
    setEditId(id);
    setFormData({ name: user.name, email: user.email, phone: user.phone, status: user.status, password: '', confirm_password: '' });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSave = async () => {
    const saveLocal = (newUser) => {
      if (editId) {
        setUsers(users.map(u => u.id === editId ? { ...u, ...newUser } : u));
      } else {
        setUsers([...users, { ...newUser, id: Date.now() }]);
      }
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', status: 'Active', password: '', confirm_password: '' });
      setEditId(null);
    };

    // If editing an existing server user (id looks like a UUID), call PUT to API
    if (editId && typeof editId === 'string' && !editId.startsWith('local-')) {
      const payload = {
        username: formData.name,
        email: formData.email,
        phone_number: formData.phone
        // deliberately NOT sending password to avoid changing it
      };
      try {
        setSaveLoading(true);
        const res = await fetch(`https://saving-api.mababa.app/api/users/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to update user: ${res.status} ${txt}`);
        }
        const updated = await res.json();
        // transform returned user to UI shape if necessary
        const updatedUser = {
          id: updated.id || editId,
          name: updated.username || formData.name,
          email: updated.email || formData.email,
          phone: updated.phone_number || formData.phone,
          status: updated.status || formData.status || 'Active'
        };
        saveLocal(updatedUser);
      } catch (err) {
        console.error(err);
        const msg = err.message || 'Failed to update user';
        toast.addToast(msg, { type: 'error' });
      } finally {
        setSaveLoading(false);
      }
      return;
    }

    // Add (create) user via signup endpoint
    if (!editId) {
      try {
        setSaveLoading(true);
        const payload = {
          username: formData.name,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          confirm_password: formData.confirm_password
        };
        const res = await fetch('https://saving-api.mababa.app/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = (body && (body.detail || body.message)) || `Signup failed: ${res.status}`;
          throw new Error(errMsg);
        }
        // success: { message, user_id, username, email, phone_number, default_password_used }
        const newUser = {
          id: body.user_id || Date.now(),
          name: body.username || formData.name,
          email: body.email || formData.email,
          phone: body.phone_number || formData.phone,
          status: 'Active'
        };
        setUsers(prev => [...prev, newUser]);
        toast.addToast((body && body.message) || 'Signup successful', { type: 'success' });
        setIsModalOpen(false);
        setFormData({ name: '', email: '', phone: '', status: 'Active', password: '', confirm_password: '' });
      } catch (err) {
        console.error(err);
        const msg = err.message || 'Failed to create user';
        toast.addToast(msg, { type: 'error' });
      } finally {
        setSaveLoading(false);
      }
      return;
    }

    // fallback/local save
    saveLocal(formData);
  };

  // Open delete confirmation modal (called from Delete button)
  const handleDelete = (id) => {
    setOpenDropdownId(null);
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  // Confirmed delete action (performs API call or local removal)
  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteLoading(true);
    try {
      // Local/mock user removal
      if (typeof id === 'string' && id.startsWith('local-')) {
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.addToast('User removed locally', { type: 'info' });
        return;
      }

      const res = await fetch(`https://saving-api.mababa.app/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
      const body = await res.json();
      setUsers(prev => prev.filter(u => u.id !== id));
      const message = (body && body.message) ? body.message : 'User deleted successfully';
      toast.addToast(message, { type: 'success' });
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to delete user';
      toast.addToast(msg, { type: 'error' });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  // Open saving modal
  const handleAddSaving = (user) => {
    setOpenDropdownId(null);
    setSavingTargetUser(user);
    setSavingAmount('');
    setShowSavingModal(true);
  };

  // Open loan modal
  const handleAddLoan = (user) => {
    setOpenDropdownId(null);
    setLoanTargetUser(user);
    setLoanAmount('');
    // default issued_date to now and deadline to 6 months from now
    const now = new Date();
    const inSixMonths = new Date(now);
    inSixMonths.setMonth(now.getMonth() + 6);
    // format for datetime-local input (YYYY-MM-DDTHH:MM)
    const toLocalInput = (d) => d.toISOString().slice(0,16);
    setLoanIssuedDate(toLocalInput(now));
    setLoanDeadline(toLocalInput(inSixMonths));
    setShowLoanModal(true);
  };

  // Add saving to user
  const confirmAddSaving = async () => {
    if (!savingTargetUser || !savingAmount) return;
    
    setSavingLoading(true);
    try {
      const payload = {
        user_id: savingTargetUser.id,
        amount: parseFloat(savingAmount)
      };
      
      const res = await fetch('https://saving-api.mababa.app/api/saving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to add saving: ${res.status} ${txt}`);
      }
      
      const result = await res.json();
      toast.addToast(`Saving of ${result.amount} added successfully for ${result.username}`, { type: 'success' });
      
      setShowSavingModal(false);
      setSavingTargetUser(null);
      setSavingAmount('');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to add saving';
      toast.addToast(msg, { type: 'error' });
    } finally {
      setSavingLoading(false);
    }
  };

  // Add loan to user
  const confirmAddLoan = async () => {
    if (!loanTargetUser || !loanAmount || !loanIssuedDate || !loanDeadline) return;
    setLoanLoading(true);
    try {
      const payload = {
        user_id: loanTargetUser.id,
        amount: parseFloat(loanAmount),
        issued_date: new Date(loanIssuedDate).toISOString(),
        deadline: new Date(loanDeadline).toISOString()
      };

      const res = await fetch('https://saving-api.mababa.app/api/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to add loan: ${res.status} ${txt}`);
      }

      const result = await res.json();
      toast.addToast(`Loan of ${new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(result.amount)} added for ${result.username}`, { type: 'success' });

      // close modal
      setShowLoanModal(false);
      setLoanTargetUser(null);
      setLoanAmount('');
      setLoanIssuedDate('');
      setLoanDeadline('');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to add loan';
      toast.addToast(msg, { type: 'error' });
    } finally {
      setLoanLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border px-3 py-2 rounded-lg w-64"
          />
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            className="border px-2 py-2 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button onClick={openAddModal} className="bg-green-500 text-white px-4 py-2 rounded-lg">Add User</button>
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div>Loading users...</div>
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600">Error loading users: {error}</div>
      )}

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left border-b">Name</th>
              <th className="py-3 px-4 text-left border-b">Total Saving</th>
              <th className="py-3 px-4 text-left border-b">Email</th>
              <th className="py-3 px-4 text-left border-b">Phone</th>
              <th className="py-3 px-4 text-left border-b">Status</th>
              <th className="py-3 px-4 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{user.name}</td>
                <td className="py-3 px-4 border-b">{typeof user.total_saving === 'number' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(user.total_saving) : '—'}</td>
                <td className="py-3 px-4 border-b">{user.email}</td>
                <td className="py-3 px-4 border-b">{user.phone}</td>
                <td className="py-3 px-4 border-b">{user.status}</td>
                <td className="py-3 px-4 border-b relative" ref={openDropdownId === user.id ? dropdownRef : null}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }}
                    className="p-2 rounded hover:bg-gray-100"
                    aria-label="Open menu"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>

                  {openDropdownId === user.id && (
                    <div className="absolute right-2 top-10 w-48 bg-white border rounded-md shadow-md z-20" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(user.id)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleAddLoan(user)} className="w-full text-left px-4 py-2 text-yellow-700 hover:bg-gray-50">Add Loan</button>
                      <button onClick={() => { setOpenDropdownId(null); setPenaltyTargetUser(user); setPenaltyReason(''); setPenaltyAmount(''); setShowPenaltyModal(true); }} className="w-full text-left px-4 py-2 text-purple-600 hover:bg-gray-50">Add Penalty</button>
                      <button onClick={() => handleAddSaving(user)} className="w-full text-left px-4 py-2 text-green-600 hover:bg-gray-50">Add Saving</button>
                      <button onClick={() => handleDelete(user.id)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}</div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Page {page} of {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editId ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="password" placeholder="Confirm password" value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} className="border px-3 py-2 rounded" />
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="border px-3 py-2 rounded">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} disabled={saveLoading} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center space-x-2">
                {saveLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{saveLoading ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Confirm delete</h3>
              <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this user? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded flex items-center space-x-2">
                {deleteLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{deleteLoading ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Saving modal */}
      {showSavingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Add Saving</h3>
              <p className="text-sm text-gray-600 mt-2">
                Add saving for: <span className="font-medium">{savingTargetUser?.name}</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                placeholder="Enter saving amount"
                value={savingAmount}
                onChange={(e) => setSavingAmount(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => { 
                  setShowSavingModal(false); 
                  setSavingTargetUser(null); 
                  setSavingAmount(''); 
                }} 
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddSaving} 
                disabled={savingLoading || !savingAmount}
                className="px-4 py-2 bg-green-600 text-white rounded flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{savingLoading ? 'Adding...' : 'Add Saving'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Penalty modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Add Penalty</h3>
              <p className="text-sm text-gray-600 mt-2">Add penalty for: <span className="font-medium">{penaltyTargetUser?.name}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                placeholder="Reason for penalty"
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setShowPenaltyModal(false); setPenaltyTargetUser(null); setPenaltyReason(''); setPenaltyAmount(''); }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // confirm add penalty
                  if (!penaltyTargetUser) return;
                  const amt = Number(penaltyAmount);
                  if (!penaltyReason || !amt || amt <= 0) {
                    toast.addToast('Please provide a valid reason and amount', { type: 'error' });
                    return;
                  }
                  setPenaltyLoading(true);
                  try {
                    const payload = { user_id: penaltyTargetUser.id, reason: penaltyReason, amount: amt, status: 'unpaid' };
                    const res = await fetch('https://saving-api.mababa.app/api/penalty', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      const txt = await res.text();
                      throw new Error(`Failed to add penalty: ${res.status} ${txt}`);
                    }
                    const body = await res.json().catch(() => ({}));
                    const msg = (body && body.message) ? body.message : 'Penalty added';
                    toast.addToast(msg, { type: 'success' });
                    // close modal
                    setShowPenaltyModal(false);
                    setPenaltyTargetUser(null);
                    setPenaltyReason('');
                    setPenaltyAmount('');
                  } catch (err) {
                    console.error(err);
                    toast.addToast(err.message || 'Failed to add penalty', { type: 'error' });
                  } finally {
                    setPenaltyLoading(false);
                  }
                }}
                disabled={penaltyLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {penaltyLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{penaltyLoading ? 'Adding...' : 'Add Penalty'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Loan modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Add Loan</h3>
              <p className="text-sm text-gray-600 mt-2">Add loan for: <span className="font-medium">{loanTargetUser?.name}</span></p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="w-full border px-3 py-2 rounded" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issued date</label>
                <input type="datetime-local" value={loanIssuedDate} onChange={e => setLoanIssuedDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="datetime-local" value={loanDeadline} onChange={e => setLoanDeadline(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => { setShowLoanModal(false); setLoanTargetUser(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmAddLoan} disabled={loanLoading || !loanAmount} className="px-4 py-2 bg-yellow-600 text-white rounded flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loanLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{loanLoading ? 'Adding...' : 'Add Loan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
