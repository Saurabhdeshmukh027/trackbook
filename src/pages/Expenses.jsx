import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  addExpense,
  deleteExpense,
  subscribeToExpenses,
  updateExpense,
} from '../supabase/db';
import { formatCurrency, formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = [
  'rent',
  'salary',
  'groceries',
  'gas',
  'transport',
  'utilities',
  'maintenance',
  'other',
];

export default function Expenses() {
  const { business } = useAuth();
  const { t } = useLanguage();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month state: Year and Month numbers (0-indexed for JS Month, 0 = Jan, 11 = Dec)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Form state
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load / Subscribe to expenses
  useEffect(() => {
    if (!business?.id) return undefined;

    const unsubscribe = subscribeToExpenses(business.id, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [business?.id]);

  // Navigate months
  const handlePrevMonth = () => {
    setSelectedDate((prev) => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { year: y, month: m };
    });
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return { year: y, month: m };
    });
  };

  // Filtered expenses for selected month
  const monthlyExpensesList = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      return (
        expDate.getFullYear() === selectedDate.year &&
        expDate.getMonth() === selectedDate.month
      );
    });
  }, [expenses, selectedDate]);

  // Total monthly expense amount
  const totalMonthlyAmount = useMemo(() => {
    return monthlyExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [monthlyExpensesList]);

  // Category summary for selected month
  const categorySummary = useMemo(() => {
    const summary = {};
    CATEGORIES.forEach((cat) => {
      summary[cat] = 0;
    });

    monthlyExpensesList.forEach((e) => {
      const cat = e.category || 'other';
      if (summary[cat] !== undefined) {
        summary[cat] += Number(e.amount || 0);
      } else {
        summary['other'] = (summary['other'] || 0) + Number(e.amount || 0);
      }
    });

    return Object.entries(summary)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [monthlyExpensesList]);

  // Handle Edit click
  const handleEditClick = (expense) => {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category || 'other');
    setDate(new Date(expense.date).toISOString().slice(0, 10));
    setNote(expense.note || '');
  };

  // Reset form
  const resetForm = () => {
    setEditingExpenseId(null);
    setTitle('');
    setAmount('');
    setCategory('other');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
  };

  // Handle submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('expenses.enterTitle') || 'Please enter title');
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error(t('expenses.enterAmount') || 'Please enter a valid amount');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        amount: amt,
        category,
        date: new Date(date).toISOString(),
        note: note.trim(),
      };

      if (editingExpenseId) {
        await updateExpense(business.id, editingExpenseId, payload);
        toast.success(t('expenses.successUpdate'));
      } else {
        await addExpense(business.id, payload);
        toast.success(t('expenses.successAdd'));
      }
      resetForm();
    } catch (error) {
      toast.error(error.message || t('expenses.failedOperation'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete click
  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteExpense(business.id, expenseToDelete.id);
      toast.success(t('expenses.successDelete'));
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      toast.error(error.message || t('expenses.failedOperation'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentMonthLabel = new Date(
    selectedDate.year,
    selectedDate.month,
    1
  ).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <BusinessShell
      title={t('nav.expenses')}
      subtitle={t('expenses.subtitle')}
    >
      <div className="space-y-6">
        {/* Month Selector header */}
        <div className="card flex items-center justify-between py-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
            {t('expenses.selectMonth')}
          </h2>
          <div className="flex items-center gap-3">
            <button className="btn-soft p-2" onClick={handlePrevMonth} style={{ minWidth: 0 }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-extrabold text-sm uppercase tracking-wider min-w-[120px] text-center" style={{ color: 'var(--accent-primary-dark)' }}>
              {currentMonthLabel}
            </span>
            <button className="btn-soft p-2" onClick={handleNextMonth} style={{ minWidth: 0 }}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Expense Overview Card */}
        <section className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, rgba(201, 75, 75, 0.94), rgba(229, 115, 115, 0.94))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <TrendingDown className="h-6 w-6 text-white" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/78">
              {t('expenses.totalExpenses')}
            </p>
            <p className="mt-2 text-[2.5rem] font-extrabold leading-none text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {formatCurrency(totalMonthlyAmount)}
            </p>
          </div>

          <div className="card">
            <p className="section-title">{t('expenses.categorySummary') || 'Category breakdown'}</p>
            <div className="mt-4 space-y-2">
              {categorySummary.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-soft)' }}>
                  {t('expenses.noExpenses')}
                </p>
              ) : (
                categorySummary.map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between text-sm py-1">
                    <span className="capitalize" style={{ color: 'var(--text-soft)' }}>
                      {t(`expenses.categories.${cat}`)}
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {formatCurrency(val)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Form and List grid */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Add / Edit Form */}
          <div className="card h-fit">
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="section-title">
                {editingExpenseId ? t('expenses.editExpense') : t('expenses.addExpense')}
              </p>
              {editingExpenseId && (
                <button className="btn-soft p-1" onClick={resetForm} style={{ minWidth: 0 }} title={t('common.cancel')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-soft)' }}>
                  {t('expenses.expenseTitle')}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('expenses.titlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-soft)' }}>
                    {t('expenses.amount')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="input"
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-soft)' }}>
                    {t('expenses.category')}
                  </label>
                  <select
                    className="input capitalize"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`expenses.categories.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-soft)' }}>
                    {t('expenses.date')}
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-soft)' }}>
                  {t('expenses.note')}
                </label>
                <textarea
                  className="input h-20 py-2 resize-none"
                  placeholder={t('expenses.notePlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                {editingExpenseId && (
                  <button type="button" className="btn-secondary flex-1" onClick={resetForm} disabled={formLoading}>
                    {t('common.cancel')}
                  </button>
                )}
                <button type="submit" className="btn-primary flex-1" disabled={formLoading}>
                  {formLoading && <span className="spinner mr-2" />}
                  {editingExpenseId ? t('common.save') : t('expenses.addExpense')}
                </button>
              </div>
            </form>
          </div>

          {/* List of expenses */}
          <div className="card">
            <p className="section-title mb-5">{t('expenses.title')} ({monthlyExpensesList.length})</p>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
              </div>
            ) : monthlyExpensesList.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-[22px]" style={{ borderColor: 'var(--border-strong)' }}>
                <Wallet className="h-8 w-8 mx-auto text-faint opacity-50" style={{ color: 'var(--text-faint)' }} />
                <p className="mt-4 text-base font-bold" style={{ color: 'var(--text-main)' }}>
                  {t('expenses.noExpenses')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyExpensesList.map((exp) => (
                  <div
                    key={exp.id}
                    className="member-row items-center justify-between"
                    style={{ padding: '14px 18px' }}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold truncate text-sm" style={{ color: 'var(--text-main)' }}>
                          {exp.title}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase capitalize shrink-0"
                          style={{
                            background: 'rgba(201, 75, 75, 0.10)',
                            color: 'var(--accent-danger)',
                          }}
                        >
                          {t(`expenses.categories.${exp.category || 'other'}`)}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-soft)' }}>
                        {formatDate(exp.date)}
                        {exp.note && ` · ${exp.note}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-sm text-right pr-2" style={{ color: 'var(--accent-danger)' }}>
                        -{formatCurrency(exp.amount)}
                      </p>

                      <button
                        className="btn-soft p-2"
                        onClick={() => handleEditClick(exp)}
                        style={{ minWidth: 0 }}
                        title={t('common.edit')}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        className="btn-soft p-2 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteClick(exp)}
                        style={{ minWidth: 0 }}
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title={t('expenses.confirmDelete')}
        message={t('expenses.deleteConfirmMsg')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
      />
    </BusinessShell>
  );
}
