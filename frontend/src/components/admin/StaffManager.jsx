import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field, EmptyState, Status } from "./AdminFields";
import { Skeleton, SkeletonTable } from "./AdminSkeleton";
import ConfirmationDialog from "./ConfirmationDialog";

function getInstitutionDisplayName(inst) {
  if (!inst) return "Unassigned";
  if (typeof inst.name === "string") return inst.name;
  if (inst.name && typeof inst.name === "object") {
    return inst.name.en || inst.name.am || inst.name.sid || inst.code || "Unassigned";
  }
  return inst.code || "Unassigned";
}

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
    <section className="space-y-4" aria-labelledby="staff-heading">
      {/* ─── Elevated Header & Primary Action ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="staff-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Staff Member Accounts
            </h2>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              {totalCount}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Authorized desk officers assigned to manage VIP appointments and orders.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={openCreateModal}
          className="rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span>
          <span>Add Staff Member</span>
        </Button>
      </div>

      {notice && (
        <div role="status" className="border-l-4 border-emerald-700 bg-emerald-50 p-3.5 text-xs text-emerald-900 rounded-r-lg">
          <p className="font-semibold">{notice}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="border-l-4 border-red-600 bg-red-50 p-3.5 text-xs text-red-900 rounded-r-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* ─── Metrics Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-3" aria-label="Staff member summary totals">
        <article className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-400"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono text-xs font-bold">
              STAFF
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600">
              Accounts
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Staff Accounts</p>
          {loading && staffList.length === 0 ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{totalCount}</p>
          )}
          <p className="mt-2 text-xs font-medium text-stone-500">Authorized desk operators</p>
        </article>

        <article className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono text-xs font-bold">
              ONLINE
            </span>
            <span className="rounded-full bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
              Active Desks
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active Desks</p>
          {loading && staffList.length === 0 ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-800">{activeCount}</p>
          )}
          <p className="mt-2 text-xs font-medium text-stone-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Serving citizen requests
          </p>
        </article>

        <article className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-stone-400 to-stone-300"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 border border-stone-200 font-mono text-xs font-bold">
              PAUSED
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-500">
              Suspended
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Deactivated</p>
          {loading && staffList.length === 0 ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-500">{inactiveCount}</p>
          )}
          <p className="mt-2 text-xs font-medium text-stone-500">Access currently paused</p>
        </article>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-8 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>

        {institutions.length > 0 && (
          <div className="min-w-[180px]">
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-2xs focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="all">All Institutions ({institutions.length})</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.code} — {getInstitutionDisplayName(inst)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${statusFilter === "all" ? "bg-white text-emerald-950 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${statusFilter === "active" ? "bg-white text-emerald-950 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${statusFilter === "inactive" ? "bg-white text-emerald-950 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
          >
            Inactive
          </button>
        </div>

        <button
          type="button"
          onClick={fetchStaff}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 shadow-2xs transition-all"
        >
          <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ─── Staff Members Table ─── */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">Staff Member</th>
              <th scope="col" className="px-4 py-3.5">Contact Phone</th>
              <th scope="col" className="px-4 py-3.5">Assigned Desk</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Registered</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && staffList.length === 0 ? (
              <SkeletonTable rows={5} columns={6} />
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon="users"
                    title={search ? "No matching staff accounts" : "No staff members registered"}
                    description={
                      search
                        ? `No staff match "${search}". Try searching for another name, email, or telephone number.`
                        : "Create a staff member account to assign them to an institution's VIP service desk."
                    }
                    action={
                      search ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
                        >
                          Clear search
                        </button>
                      ) : (
                        <Button type="button" onClick={openCreateModal}>
                          + Add First Staff Member
                        </Button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              staffList.map((staff) => {
                const inst = staff.institution;
                const instName = getInstitutionDisplayName(inst);

                return (
                  <tr key={staff.id} className="border-t border-stone-100 hover:bg-stone-50/60 transition-colors">
                    {/* Staff Name & Avatar */}
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs shadow-2xs">
                          {(staff.name || "S").slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-bold text-stone-900 leading-snug">{staff.name}</p>
                          <p className="text-xs text-stone-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 align-middle text-xs text-stone-700">
                      {staff.phone ? (
                        <a href={`tel:${staff.phone}`} className="inline-flex items-center gap-1 hover:underline">
                          <span>📞</span> {staff.phone}
                        </a>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* Assigned Desk */}
                    <td className="px-4 py-3.5 align-middle text-xs">
                      <div className="flex items-center gap-2">
                        {inst?.code && (
                          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            {inst.code}
                          </span>
                        )}
                        <span className="font-medium text-stone-800">{instName}</span>
                      </div>
                      {inst?.floorRoomNumber && (
                        <p className="mt-0.5 text-[11px] text-stone-500">Desk / Counter: {inst.floorRoomNumber}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-middle">
                      <Status active={staff.isActive} />
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs text-stone-500">
                      {formatDate(staff.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 align-middle text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-2xs transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStaff(staff)}
                          className="rounded-lg border border-red-200/80 bg-red-50/60 p-1.5 text-xs text-red-600 hover:bg-red-100 shadow-2xs transition-all"
                          title="Delete staff account"
                        >
                          🗑
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingStaff ? `Edit Staff Member: ${editingStaff.name}` : "Create New Staff Member"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
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
                      {inst.code} — {getInstitutionDisplayName(inst)}
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

