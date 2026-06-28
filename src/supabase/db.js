import { supabase } from './config';

// ─── Photo Upload ───────────────────────────────────────────────────────────

/**
 * Compress an image File before uploading to reduce size.
 */
const compressImageForUpload = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim; }
          else { width = (width / height) * maxDim; height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' })),
          'image/jpeg',
          0.82
        );
      };
      const dataUrl = e.target.result;
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  });
};

export const uploadCustomerPhoto = async (businessId, file) => {
  // Always compress + convert to JPEG before upload
  const compressed = await compressImageForUpload(file);
  const fileName = `${businessId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from('customer-photos')
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/jpeg',
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('customer-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// ─── Timestamp helpers ──────────────────────────────────────────────────────
export const Timestamp = {
  fromDate: (date) => date.toISOString(),
  now: () => new Date().toISOString(),
};

export const serverTimestamp = () => new Date().toISOString();

// ─── Businesses ─────────────────────────────────────────────────────────────

export const getBusinessByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
};

export const createBusiness = async (userId, data) => {
  const { error } = await supabase.from('businesses').insert({
    id: userId,
    owner_name: data.ownerName || '',
    business_name: data.businessName || '',
    mobile: data.mobile || '',
    email: data.email || '',
    status: 'pending',
    customer_count: 0,
    created_at: serverTimestamp(),
  });

  if (error) throw error;
};

export const updateBusiness = async (businessId, data) => {
  const { data: updated, error } = await supabase
    .from('businesses')
    .update(data)
    .eq('id', businessId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    throw new Error('Business update was rejected. Please sign in again and try once more.');
  }
  return updated;
};

export const getAllBusinesses = async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const subscribeToBusinesses = (callback) => {
  let unsubscribed = false;

  const fetchAndNotify = async () => {
    try {
      const data = await getAllBusinesses();
      if (!unsubscribed) callback(data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchAndNotify();

  const channel = supabase
    .channel('public:businesses')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, fetchAndNotify)
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
};

// ─── Admin Check ────────────────────────────────────────────────────────────

export const checkIsAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
};

// ─── Customers ──────────────────────────────────────────────────────────────

export const addCustomer = async (businessId, data) => {
  const { data: result, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      name: data.name,
      mobile: data.mobile || '',
      address: data.address || '',
      photo_url: data.photo_url || '',
      meal_plan: data.meal_plan || 'monthly',
      subscription_amount: data.subscription_amount || 0,
      subscription_duration: data.subscription_duration || 30,
      start_date: data.start_date,
      end_date: data.end_date,
      amount_paid: data.amount_paid || 0,
      amount_due: data.amount_due || 0,
      status: 'active',
      created_at: serverTimestamp(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A customer with this mobile number already exists');
    }
    throw error;
  }

  // Update customer count
  const business = await getBusinessByUserId(businessId);
  if (business) {
    await updateBusiness(businessId, { customer_count: (business.customer_count || 0) + 1 });
  }

  return { id: result.id };
};

export const updateCustomer = async (businessId, customerId, data) => {
  const { error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', customerId)
    .eq('business_id', businessId);
  if (error) {
    if (error.code === '23505') {
      throw new Error('A customer with this mobile number already exists');
    }
    throw error;
  }
};

export const deleteCustomer = async (businessId, customerId) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('business_id', businessId);
  if (error) throw error;

  const business = await getBusinessByUserId(businessId);
  if (business && business.customer_count > 0) {
    await updateBusiness(businessId, { customer_count: business.customer_count - 1 });
  }
};

export const getCustomersByBusiness = async (businessId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('name');
  if (error) throw error;
  return data || [];
};

export const getCustomerById = async (businessId, customerId) => {
  const id = parseInt(customerId, 10);
  if (isNaN(id)) return null;

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (error || !data) return null;
  return data;
};

export const subscribeToCustomers = (businessId, callback) => {
  let unsubscribed = false;

  const fetchAndNotify = async () => {
    try {
      const data = await getCustomersByBusiness(businessId);
      if (!unsubscribed) callback(data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchAndNotify();

  const channel = supabase
    .channel(`public:customers:business_id=eq.${businessId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'customers',
      filter: `business_id=eq.${businessId}`,
    }, fetchAndNotify)
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
};

// Alias used by DueList — subscribes to customers with due/overdue status
export const subscribeToDueMembers = (businessId, callback) => {
  return subscribeToCustomers(businessId, (customers) => {
    // Map snake_case DB fields to camelCase for DueList compatibility
    const dueMembers = customers
      .filter((c) => {
        const end = c.end_date ? new Date(c.end_date) : null;
        if (!end) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endNorm = new Date(end);
        endNorm.setHours(0, 0, 0, 0);
        return endNorm <= today;
      })
      .map((c) => ({
        ...c,
        // camelCase aliases for DueList
        photoURL: c.photo_url,
        amountDue: c.amount_due,
        amountPaid: c.amount_paid,
        subscriptionAmount: c.subscription_amount,
        subscriptionEndDate: c.end_date,
      }));
    callback(dueMembers);
  });
};

export const subscribeToCustomer = (businessId, customerId, callback) => {
  let unsubscribed = false;

  const fetchAndNotify = async () => {
    const data = await getCustomerById(businessId, customerId);
    if (!unsubscribed && data) callback(data);
  };

  fetchAndNotify();

  const channel = supabase
    .channel(`public:customers:id=eq.${customerId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'customers',
      filter: `id=eq.${customerId}`,
    }, fetchAndNotify)
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
};

// ─── Payments ───────────────────────────────────────────────────────────────

export const addPayment = async (businessId, customerId, data) => {
  const { error } = await supabase.from('payments').insert({
    business_id: businessId,
    customer_id: customerId,
    amount: data.amount || 0,
    payment_mode: data.payment_mode || 'cash',
    note: data.note || '',
    date: data.date || serverTimestamp(),
  });
  if (error) throw error;
};

export const getPaymentsByCustomer = async (businessId, customerId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getPaymentsByBusiness = async (businessId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, customers(name, mobile)')
    .eq('business_id', businessId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getRecentPayments = async (businessId, limit = 20) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, customers(name, mobile)')
    .eq('business_id', businessId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// ─── Meal Pause ─────────────────────────────────────────────────────────────

export const addMealPause = async (businessId, customerId, data) => {
  const { error } = await supabase.from('meal_pause').insert({
    business_id: businessId,
    customer_id: customerId,
    from_date: data.from_date,
    to_date: data.to_date,
    days: data.days || 0,
    reason: data.reason || '',
    settled: false,
    created_at: serverTimestamp(),
  });
  if (error) throw error;
};

export const getUnsettledMealPauses = async (businessId, customerId) => {
  const { data, error } = await supabase
    .from('meal_pause')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('settled', false)
    .order('from_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAllMealPauses = async (businessId, customerId) => {
  const { data, error } = await supabase
    .from('meal_pause')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMealPausesByBusiness = async (businessId) => {
  const { data, error } = await supabase
    .from('meal_pause')
    .select('*, customers(name, mobile)')
    .eq('business_id', businessId)
    .eq('settled', false)
    .order('from_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const settleMealPauses = async (businessId, customerId, pauseIds, daysExtended) => {
  const { error } = await supabase
    .from('meal_pause')
    .update({
      settled: true,
      settled_at: serverTimestamp(),
    })
    .in('id', pauseIds)
    .eq('business_id', businessId)
    .eq('customer_id', customerId);

  if (error) throw error;
};

// ─── Follow-ups ─────────────────────────────────────────────────────────────

export const addFollowUp = async (businessId, customerId, data) => {
  const { error } = await supabase.from('follow_ups').insert({
    business_id: businessId,
    customer_id: customerId,
    type: data.type || 'call',
    note: data.note || '',
    snooze_until: data.snooze_until || null,
    created_at: serverTimestamp(),
  });
  if (error) throw error;
};

export const getFollowUpsByCustomer = async (businessId, customerId) => {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};

export const getLatestFollowUps = async (businessId) => {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*, customers(name, mobile)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

export const getSnoozedCustomerIds = async (businessId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('follow_ups')
    .select('customer_id, snooze_until')
    .eq('business_id', businessId)
    .gte('snooze_until', today);

  if (error) return new Set();
  return new Set((data || []).map((f) => f.customer_id));
};

// ─── Expenses ───────────────────────────────────────────────────────────────

export const addExpense = async (businessId, data) => {
  const { error } = await supabase.from('expenses').insert({
    business_id: businessId,
    title: data.title || '',
    amount: data.amount || 0,
    category: data.category || 'other',
    date: data.date || serverTimestamp(),
    note: data.note || '',
  });
  if (error) throw error;
};

export const updateExpense = async (businessId, expenseId, data) => {
  const { error } = await supabase
    .from('expenses')
    .update({
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note,
    })
    .eq('id', expenseId)
    .eq('business_id', businessId);
  if (error) throw error;
};

export const deleteExpense = async (businessId, expenseId) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('business_id', businessId);
  if (error) throw error;
};

export const getExpensesByBusiness = async (businessId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', businessId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const subscribeToExpenses = (businessId, callback) => {
  let unsubscribed = false;

  const fetchAndNotify = async () => {
    try {
      const data = await getExpensesByBusiness(businessId);
      if (!unsubscribed) callback(data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchAndNotify();

  const channel = supabase
    .channel(`public:expenses:business_id=eq.${businessId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `business_id=eq.${businessId}`,
    }, fetchAndNotify)
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
};

// ─── Collections ─────────────────────────────────────────────────────────────

export const addCollection = async (businessId, customerId, data) => {
  const qty = Number(data.qty) || 1;
  const rate = Number(data.rate) || 0;
  const amount = qty * rate;

  const { error } = await supabase.from('collections').insert({
    business_id: businessId,
    customer_id: customerId,
    item: data.item || 'Parcel',
    qty,
    rate,
    amount,
    paid: false,
    payment_mode: 'cash',
    date: data.date || serverTimestamp(),
    note: data.note || '',
    created_at: serverTimestamp(),
  });
  if (error) throw error;
};

export const getCollectionsByCustomer = async (businessId, customerId) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getCollectionsByBusiness = async (businessId) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*, customers(name, mobile)')
    .eq('business_id', businessId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const collectCollectionPayment = async (businessId, collectionId, paymentMode) => {
  const { error } = await supabase
    .from('collections')
    .update({
      paid: true,
      paid_at: serverTimestamp(),
      payment_mode: paymentMode || 'cash',
    })
    .eq('id', collectionId)
    .eq('business_id', businessId);
  if (error) throw error;
};

export const deleteCollection = async (businessId, collectionId) => {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('business_id', businessId);
  if (error) throw error;
};
