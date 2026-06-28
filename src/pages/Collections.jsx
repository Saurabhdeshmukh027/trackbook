import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  BadgeIndianRupee, CheckCircle2, ChevronDown, IndianRupee,
  Package, Plus, ShoppingBag, Trash2, UtensilsCrossed, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  addCollection,
  collectCollectionPayment,
  deleteCollection,
  getCollectionsByCustomer,
  getCollectionsByBusiness,
  getCustomerById,
  getCustomersByBusiness,
} from '../supabase/db';
import { formatCurrency, formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';

// ── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { key: 'Parcel', label: 'Parcel', icon: Package, emoji: '📦' },
  { key: 'Extra Meal', label: 'Extra Meal', icon: UtensilsCrossed, emoji: '🍛' },
  { key: 'One-time Meal', label: 'One-time Meal', icon: UtensilsCrossed, emoji: '🍽️' },
  { key: 'Special Item', label: 'Special Item', icon: ShoppingBag, emoji: '🛍️' },
  { key: 'custom', label: 'Custom…', icon: Plus, emoji: '✏️' },
];

// ── Pay Modal ─────────────────────────────────────────────────────────────────
function CollectPayModal({ isOpen, collection, businessId, onClose, onSuccess }) {
  const [paymentMode, setPaymentMode] = useState('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setPaymentMode('cash');
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen || !collection) return null;

  const handleCollect = async () => {
    setLoading(true);
    try {
      await collectCollectionPayment(businessId, collection.id, paymentMode);
      toast.success(`✅ ₹${collection.amount} collected for ${collection.item}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(54, 43, 36, 0.36)',
          backdropFilter: 'blur(10px)',
        }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 81,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div className="premium-card animate-fade-up w-full max-w-sm">
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(42, 143, 121, 0.12)', color: 'var(--accent-tertiary)' }}>
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Collect Payment
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>{collection.item}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: 8, minWidth: 0 }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-[20px] border p-5 text-center"
              style={{ borderColor: 'rgba(42, 143, 121, 0.3)', background: 'rgba(42, 143, 121, 0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Amount to Collect</p>
              <p className="mt-2 text-3xl font-extrabold" style={{ color: 'var(--accent-tertiary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatCurrency(collection.amount)}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>
                {collection.qty} × {formatCurrency(collection.rate)} · {collection.item}
              </p>
            </div>

            <div>
              <p className="label">Payment Mode</p>
              <div className="flex gap-2 mt-1">
                {['cash', 'upi', 'bank'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={paymentMode === mode ? 'btn-soft' : 'btn-ghost'}
                    style={paymentMode === mode ? {
                      background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.20), rgba(42, 143, 121, 0.12))',
                      color: 'var(--accent-tertiary)',
                      border: '1px solid rgba(42, 143, 121, 0.25)',
                    } : undefined}
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI' : 'Bank'}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleCollect}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.92), rgba(76, 175, 140, 0.92))' }}
            >
              {loading ? <span className="spinner" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Processing…' : `Collect ${formatCurrency(collection.amount)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Collections() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Add form state
  const [formCustomerId, setFormCustomerId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('Parcel');
  const [customItem, setCustomItem] = useState('');
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [keepAsDue, setKeepAsDue] = useState(false);
  const [formPaymentMode, setFormPaymentMode] = useState('cash');

  // Pay modal
  const [payModal, setPayModal] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter tabs
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'paid'

  const isCustom = selectedPreset === 'custom';
  const itemName = isCustom ? customItem : selectedPreset;
  const totalAmount = (Number(qty) || 0) * (Number(rate) || 0);

  const loadCollections = async () => {
    if (!business?.id) return;
    try {
      if (id) {
        const data = await getCollectionsByCustomer(business.id, parseInt(id, 10));
        setCollections(data);
      } else {
        const data = await getCollectionsByBusiness(business.id);
        setCollections(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load collections');
    }
  };

  useEffect(() => {
    if (!business?.id) return;
    (async () => {
      setInitLoading(true);
      try {
        if (id) {
          const cust = await getCustomerById(business.id, id);
          setCustomer(cust);
          setFormCustomerId(String(cust.id));
        } else {
          setCustomer(null);
          setFormCustomerId('');
          const custs = await getCustomersByBusiness(business.id);
          setAllCustomers(custs);
        }
        await loadCollections();
      } catch (err) {
        console.error(err);
      } finally {
        setInitLoading(false);
      }
    })();
  }, [business?.id, id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) { toast.error('Please select or enter an item name'); return; }
    if (!rate || Number(rate) <= 0) { toast.error('Please enter a valid rate'); return; }

    setLoading(true);
    try {
      const targetCustomerId = id ? parseInt(id, 10) : (formCustomerId ? parseInt(formCustomerId, 10) : null);
      await addCollection(business.id, targetCustomerId, {
        item: itemName.trim(),
        qty: Number(qty),
        rate: Number(rate),
        paid: !keepAsDue,
        payment_mode: keepAsDue ? 'cash' : formPaymentMode,
        date: new Date(date).toISOString(),
        note,
      });
      toast.success(`✅ ${itemName} added — ${formatCurrency(totalAmount)} (${keepAsDue ? 'Due' : 'Collected'})`);
      // Reset form
      setRate('');
      setQty(1);
      setNote('');
      setCustomItem('');
      await loadCollections();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCollection(business.id, deleteTarget.id);
      toast.success('Collection entry removed');
      setDeleteTarget(null);
      await loadCollections();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = collections.filter((c) => {
    if (filter === 'pending') return !c.paid;
    if (filter === 'paid') return c.paid;
    return true;
  });

  const pendingTotal = collections.filter((c) => !c.paid).reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = collections.filter((c) => c.paid).reduce((s, c) => s + Number(c.amount), 0);

  if (initLoading) {
    return (
      <BusinessShell title="Collections" subtitle="Loading…">
        <div className="card flex items-center justify-center py-16">
          <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title="Collections" subtitle={customer ? customer.name : 'All Customer & Guest Collections'}>
      <div className="space-y-6">
        <PageHeader 
          title="Collections" 
          subtitle={customer ? customer.name : 'All Customer & Guest Collections'} 
        />

        {/* Scoped Customer strip or General Summary strip */}
        <section className="card">
          {customer ? (
            <div className="flex items-center gap-4">
              <MemberAvatar photoURL={customer.photo_url} name={customer.name} size={64} rounded="22px" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-extrabold truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                  {customer.name}
                </h2>
                {customer.mobile && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-soft)' }}>{customer.mobile}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(201, 75, 75, 0.10)', color: 'var(--accent-danger)' }}>
                  Pending: {formatCurrency(pendingTotal)}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(42, 143, 121, 0.10)', color: 'var(--accent-tertiary)' }}>
                  Collected: {formatCurrency(paidTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                  Collections Summary
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>Total extra sales logged across the business</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Total Pending</p>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--accent-danger)' }}>{formatCurrency(pendingTotal)}</p>
                </div>
                <div className="text-right border-l pl-4" style={{ borderColor: 'var(--border-soft)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Total Collected</p>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--accent-tertiary)' }}>{formatCurrency(paidTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ── Collection List ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'paid', label: 'Collected' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={filter === key ? 'btn-soft' : 'btn-ghost'}
                  style={filter === key ? {
                    background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.24), rgba(231, 111, 81, 0.18))',
                    color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.2)',
                  } : undefined}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  {key === 'pending' && pendingTotal > 0 && (
                    <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(201, 75, 75, 0.15)', color: 'var(--accent-danger)' }}>
                      {collections.filter((c) => !c.paid).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Entries */}
            <div className="card space-y-3">
              <p className="section-title">
                {filter === 'all' ? 'All Collections' : filter === 'pending' ? 'Pending Collections' : 'Collected'}
              </p>

              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <BadgeIndianRupee className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--text-faint)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                    {filter === 'pending' ? 'No pending collections' : filter === 'paid' ? 'No collected items yet' : 'No collections yet'}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>Add a parcel, extra meal, or guest charge using the form</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-[18px] border px-4 py-3 gap-3"
                      style={{
                        borderColor: c.paid ? 'rgba(42, 143, 121, 0.18)' : 'var(--border-soft)',
                        background: c.paid ? 'rgba(42, 143, 121, 0.04)' : 'transparent',
                      }}
                    >
                      {/* Left */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] text-base"
                          style={{ background: c.paid ? 'rgba(42, 143, 121, 0.12)' : 'rgba(244, 162, 97, 0.12)' }}>
                          {c.item === 'Parcel' ? '📦' : c.item === 'Extra Meal' ? '🍛' : c.item === 'One-time Meal' ? '🍽️' : c.item === 'Special Item' ? '🛍️' : '✏️'}
                        </div>
                        <div className="min-w-0">
                          {/* Item header with customer badge/link */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{c.item}</span>
                            {c.customers ? (
                              <Link 
                                to={`/customers/${c.customer_id}`} 
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full hover:underline"
                                style={{ background: 'rgba(244, 162, 97, 0.10)', color: 'var(--accent-primary-dark)' }}
                              >
                                {c.customers.name}
                              </Link>
                            ) : (
                              <span 
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(155, 136, 120, 0.12)', color: 'var(--text-soft)' }}
                              >
                                Guest / Walk-in
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-soft)' }}>
                            {c.qty} × {formatCurrency(c.rate)} · {formatDate(c.date)}
                          </p>
                          {c.note && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>{c.note}</p>}
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-extrabold" style={{ color: c.paid ? 'var(--accent-tertiary)' : 'var(--text-main)' }}>
                            {formatCurrency(c.amount)}
                          </p>
                          {c.paid ? (
                            <span className="badge-success text-[10px]">Collected</span>
                          ) : (
                            <button
                              type="button"
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                              style={{ background: 'rgba(42, 143, 121, 0.12)', color: 'var(--accent-tertiary)' }}
                              onClick={() => setPayModal(c)}
                            >
                              Collect ₹
                            </button>
                          )}
                        </div>
                        {!c.paid && (
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-red-50"
                            style={{ color: 'var(--accent-danger)' }}
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Add Form ─────────────────────────────────────────────────────── */}
          <form onSubmit={handleAdd} className="card space-y-5 h-fit">
            <p className="section-title">Record Charge</p>

            {/* Customer dropdown selector (only if not scoped to a customer) */}
            {!id && (
              <div>
                <label className="label" htmlFor="col-customer">Link to Customer (Optional)</label>
                <div className="relative mt-1">
                  <select
                    id="col-customer"
                    className="input pr-10"
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                  >
                    <option value="">Guest / Walk-in (No customer)</option>
                    {allCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.mobile ? `(${c.mobile})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-soft)' }} />
                </div>
              </div>
            )}

            {/* Preset selector */}
            <div>
              <p className="label">Item Type</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={selectedPreset === p.key ? 'btn-soft' : 'btn-ghost'}
                    style={{
                      justifyContent: 'flex-start', gap: 8,
                      ...(selectedPreset === p.key ? {
                        background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.22), rgba(231, 111, 81, 0.16))',
                        color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.22)',
                      } : {}),
                    }}
                    onClick={() => setSelectedPreset(p.key)}
                  >
                    <span className="text-base">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom name input (only when custom selected) */}
            {isCustom && (
              <div>
                <label className="label" htmlFor="custom-item">Item Name</label>
                <input
                  id="custom-item"
                  className="input"
                  placeholder="e.g. Extra Roti, Delivery charge…"
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Qty + Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="col-qty">Qty / Days</label>
                <input
                  id="col-qty"
                  className="input"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="col-rate">Rate (₹)</label>
                <input
                  id="col-rate"
                  className="input"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </div>

            {/* Total preview */}
            {totalAmount > 0 && (
              <div className="flex items-center justify-between rounded-[16px] border px-4 py-3"
                style={{ borderColor: 'var(--border-soft)', background: 'rgba(244, 162, 97, 0.06)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-soft)' }}>Total</span>
                <span className="text-xl font-extrabold" style={{ color: 'var(--accent-primary-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="label" htmlFor="col-date">Date</label>
              <input
                id="col-date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Keep as Due Toggle & Payment Mode */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  style={{ accentColor: 'var(--accent-primary)' }}
                  checked={keepAsDue}
                  onChange={(e) => setKeepAsDue(e.target.checked)}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                  Keep as Due (Pay later)
                </span>
              </label>

              {!keepAsDue && (
                <div className="animate-fade-in">
                  <p className="label">Payment Mode</p>
                  <div className="flex gap-2 mt-1">
                    {['cash', 'upi', 'bank'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={formPaymentMode === mode ? 'btn-soft' : 'btn-ghost'}
                        style={formPaymentMode === mode ? {
                          background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.20), rgba(42, 143, 121, 0.12))',
                          color: 'var(--accent-tertiary)',
                          border: '1px solid rgba(42, 143, 121, 0.25)',
                        } : undefined}
                        onClick={() => setFormPaymentMode(mode)}
                      >
                        {mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI' : 'Bank'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="label" htmlFor="col-note">Note (optional)</label>
              <input
                id="col-note"
                className="input"
                placeholder="Any extra details…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <Plus className="h-4 w-4" />}
              {loading ? 'Adding…' : 'Record Charge'}
            </button>
          </form>
        </section>
      </div>

      {/* Collect Payment Modal */}
      <CollectPayModal
        isOpen={!!payModal}
        collection={payModal}
        businessId={business?.id}
        onClose={() => setPayModal(null)}
        onSuccess={loadCollections}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Collection?"
        message={deleteTarget ? `Remove "${deleteTarget.item}" — ${formatCurrency(deleteTarget.amount)}? This cannot be undone.` : ''}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </BusinessShell>
  );
}
