import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field } from "./AdminFields";
import ConfirmationDialog from "./ConfirmationDialog";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function StaffManager({ institutions = [], currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formInstitutionId, setFormInstitutionId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Deletion confirmation dialog
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        limit: 50,
      };
      if (search.trim()) params.search = search.trim();
      if (institutionFilter !== "all") params.institutionId = institutionFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await adminApi.staff.list(params);
      setStaffList(res?.data || []);
      setTotalCount(res?.meta?.total || (res?.data || []).length);
    } catch (err) {
      setError(err.message || "Failed to load staff accounts.");
    } finally {
      setLoading(false);
    }
  }, [search, institutionFilter, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPhone("");
    setFormInstitutionId(institutions[0]?.id || "");
    setFormIsActive(true);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormName(staff.name || "");
    setFormEmail(staff.email || "");
    setFormPassword(""); // Password is blank unless changing
    setFormPhone(staff.phone || "");
    setFormInstitutionId(staff.institutionId || staff.institution?.id || "");
    setFormIsActive(staff.isActive !== false);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formName.trim() || formName.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      nextErrors.email = "A valid email address is required.";
    }
    if (!editingStaff && (!formPassword || formPassword.length < 6)) {
      nextErrors.password = "Password must be at least 6 characters long.";
    }
    if (editingStaff && formPassword && formPassword.length < 6) {
      nextErrors.password = "New password must be at least 6 characters long.";
    }
    if (!formInstitutionId) {
      nextErrors.institutionId = "Please select an assigned institution.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingStaff) {
        const updatePayload = {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          phone: formPhone.trim() || null,
          institutionId: formInstitutionId,
          isActive: formIsActive,
        };
        if (formPassword) {
          updatePayload.password = formPassword;
        }

        await adminApi.staff.update(editingStaff.id, updatePayload);
        setNotice(`Staff member "${formName.trim()}" updated successfully.`);
      } else {
        await adminApi.staff.create({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          phone: formPhone.trim() || undefined,
          institutionId: formInstitutionId,
          isActive: formIsActive,
        });
        setNotice(`Staff member "${formName.trim()}" created successfully.`);
      }

      setModalOpen(false);
      await fetchStaff();
    } catch (err) {
      setError(err.message || "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setDeleteBusy(true);
    setError("");
    setNotice("");
    try {
      await adminApi.staff.delete(deletingStaff.id);
      setNotice(`Staff account for "${deletingStaff.name}" has been deleted.`);
      setDeletingStaff(null);
      await fetchStaff();
    } catch (err) {
      setError(err.message || "Failed to delete staff member.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const activeCount = staffList.filter((s) => s.isActive).length;
  const inactiveCount = staffList.length - activeCount;

  return (
    <section className="admin-section" aria-labelledby="staff-heading">
      {/* ─── Header & Primary Action ─── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Institution Desk Accounts</p>
          <h2 id="staff-heading" className="text-2xl font-bold text-stone-900">
            Staff members <span className="ml-1 text-base font-medium text-stone-500">{totalCount}</span>
          </h2>
        </div>
        <Button type="button" variant="primary" onClick={openCreateModal}>
          + Add Staff Member
        </Button>
      </div>

      {notice && (
        <div role="status" className="mb-4 border-l-4 border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{notice}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* ─── Metrics Cards ─── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Staff member summary totals">
        <article className="border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-600">Total Staff Accounts</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{totalCount}</p>
        </article>
        <article className="border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-600">Active Desks</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{activeCount}</p>
        </article>
        <article className="border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-600">Deactivated</p>
          <p className="mt-1 text-2xl font-bold text-stone-500">{inactiveCount}</p>
        </article>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className={FIELD_CLASS}
          />
        </div>

        {institutions.length > 0 && (
          <div className="min-w-[180px]">
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="all">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.code} — {inst.name?.en || inst.name || inst.code}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex rounded border border-stone-300 bg-white">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 text-xs font-semibold ${statusFilter === "all" ? "bg-emerald-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-2 text-xs font-semibold ${statusFilter === "active" ? "bg-emerald-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-2 text-xs font-semibold ${statusFilter === "inactive" ? "bg-emerald-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}
          >
            Inactive
          </button>
        </div>

        <Button type="button" variant="secondary" onClick={fetchStaff} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </Button>
      </div>

      {/* ─── Staff Members Table ─── */}
      <div className="overflow-x-auto border border-stone-200 bg-white shadow-xs">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th scope="col" className="px-4 py-3">Staff Member</th>
              <th scope="col" className="px-4 py-3">Phone</th>
              <th scope="col" className="px-4 py-3">Bound Institution Desk</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Created</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && staffList.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">
                  Loading staff accounts...
                </td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">
                  No staff members match the selected filters.
                </td>
              </tr>
            ) : (
              staffList.map((staff) => {
                const inst = staff.institution;
                const instName = inst?.name?.en || inst?.name || inst?.code || "Unassigned";

                return (
                  <tr key={staff.id} className="border-t border-stone-200 hover:bg-stone-50/50">
                    <td className="px-4 py-4">
                      <p className="font-bold text-stone-900">{staff.name}</p>
                      <p className="text-xs text-stone-500">{staff.email}</p>
                    </td>

                    <td className="px-4 py-4 text-xs text-stone-700">
                      {staff.phone || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {inst?.code && (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
                            {inst.code}
                          </span>
                        )}
                        <span className="font-medium text-stone-800">{instName}</span>
                      </div>
                      {inst?.floorRoomNumber && (
                        <p className="mt-0.5 text-[11px] text-stone-500">Counter: {inst.floorRoomNumber}</p>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          staff.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {staff.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-stone-500">
                      {formatDate(staff.createdAt)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        className="rounded border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingStaff(staff)}
                        className="rounded border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Add / Edit Staff Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">
                {editingStaff ? `Edit Staff Member: ${editingStaff.name}` : "Create New Staff Member"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <Field label="Full Name" error={formErrors.name}>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Abebe Kebede"
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Email Address" error={formErrors.email}>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. cbe.staff@mesob.hawassa.gov.et"
                  className={FIELD_CLASS}
                />
              </Field>

              <Field
                label={editingStaff ? "Reset Password (leave empty to keep current)" : "Password"}
                error={formErrors.password}
              >
                <input
                  type="password"
                  required={!editingStaff}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingStaff ? "•••••••• (unchanged)" : "Minimum 6 characters"}
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Phone Number (Optional)" error={formErrors.phone}>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 0911223344"
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Assigned Institution Desk" error={formErrors.institutionId}>
                <select
                  required
                  value={formInstitutionId}
                  onChange={(e) => setFormInstitutionId(e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">Select an institution...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.code} — {inst.name?.en || inst.name || inst.code}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="form-is-active" className="text-sm font-medium text-stone-800">
                  Account is active (can log into dashboard)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
                <Button type="button" variant="secondary" disabled={saving} onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : editingStaff ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      <ConfirmationDialog
        open={Boolean(deletingStaff)}
        title="Delete staff account permanently?"
        message={`Are you sure you want to delete the staff account for "${deletingStaff?.name}" (${deletingStaff?.email})? They will no longer be able to log in.`}
        confirmLabel="Delete Staff"
        busy={deleteBusy}
        onCancel={() => setDeletingStaff(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}

