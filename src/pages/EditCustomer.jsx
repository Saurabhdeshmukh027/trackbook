import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Camera, FileImage, ImagePlus, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getCustomerById, updateCustomer, uploadCustomerPhoto } from '../supabase/db';
import { getMealPlanLabel } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import PageHeader from '../components/PageHeader';
import CameraCapture from '../components/CameraCapture';

export default function EditCustomer() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (!business?.id || !id) return;
    (async () => {
      const data = await getCustomerById(business.id, id);
      if (data) {
        setCustomer(data);
        setValue('name', data.name);
        setValue('mobile', data.mobile);
        setValue('address', data.address);
        setValue('subscription_amount', data.subscription_amount);
        // Set existing photo as preview
        if (data.photo_url) {
          setPhotoPreview(data.photo_url);
        }
      }
    })();
  }, [business?.id, id]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (file) => {
    setCameraOpen(false);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    const mobile = data.mobile?.replace(/\D/g, '');
    if (mobile && (mobile.length !== 10 || !/^[6-9]/.test(mobile))) {
      toast.error(t('addCustomer.invalidMobile'));
      return;
    }

    setLoading(true);
    try {
      // Upload new photo if selected
      let photoUrl = customer.photo_url || '';
      if (photoFile) {
        try {
          photoUrl = await uploadCustomerPhoto(business.id, photoFile);
        } catch (photoError) {
          console.warn('Photo upload failed:', photoError);
          toast.error('Photo upload failed, keeping existing photo.');
        }
      } else if (!photoPreview) {
        // User removed the photo
        photoUrl = '';
      }

      await updateCustomer(business.id, id, {
        name: data.name.trim(),
        mobile: mobile || '',
        address: data.address?.trim() || '',
        subscription_amount: Number(data.subscription_amount),
        photo_url: photoUrl,
      });
      toast.success(t('editCustomer.customerUpdated'));
      navigate(`/customers/${id}`);
    } catch (error) {
      toast.error(error.message || t('editCustomer.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <BusinessShell title={t('editCustomer.title')} subtitle={t('common.loading')}>
        <div className="card flex items-center justify-center py-16">
          <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title={t('editCustomer.title')} subtitle={customer.name}>
      <div className="space-y-6">
        <PageHeader title={t('editCustomer.title')} subtitle={customer.name} />

        <form className="card space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Photo Upload */}
          <div>
            <p className="section-title">{t('addCustomer.customerPhoto') || 'Customer Photo'}</p>
            <div className="mt-4 flex items-center gap-5">
              <div
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22px]"
                style={{
                  background: photoPreview ? 'transparent' : 'linear-gradient(135deg, rgba(244, 162, 97, 0.18), rgba(231, 111, 81, 0.12))',
                  border: '2px dashed',
                  borderColor: photoPreview ? 'transparent' : 'rgba(214, 194, 174, 0.6)',
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-[20px]" />
                ) : (
                  <Camera className="h-7 w-7" style={{ color: 'var(--accent-primary)' }} />
                )}
              </div>
              <div>
                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {photoPreview ? (t('addCustomer.changePhoto') || 'Change Photo') : (t('addCustomer.addPhoto') || 'Add Photo')}
                    </button>
                    {photoPreview && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                        {t('common.remove') || 'Remove'}
                      </button>
                    )}
                  </div>
                  {showPhotoMenu && (
                    <div
                      className="absolute left-0 top-full z-20 mt-2 overflow-hidden rounded-[16px] border shadow-lg"
                      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-primary)', minWidth: '180px' }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(244,162,97,0.08)]"
                        style={{ color: 'var(--text-main)' }}
                        onClick={() => { setShowPhotoMenu(false); setCameraOpen(true); }}
                      >
                        <Camera className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
                        {t('addCustomer.camera') || 'Take Photo'}
                      </button>
                      <div style={{ height: '1px', background: 'var(--border-soft)' }} />
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(244,162,97,0.08)]"
                        style={{ color: 'var(--text-main)' }}
                        onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
                      >
                        <FileImage className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
                        {t('addCustomer.document') || 'Choose from Gallery'}
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {t('addCustomer.photoHint') || 'Take a photo or pick from gallery'}
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">{t('common.name')} *</label>
              <input id="name" className={`input ${errors.name ? 'border-red-500' : ''}`}
                {...register('name', { required: t('addCustomer.nameRequired') })} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">{t('common.mobile')}</label>
              <input id="mobile" className="input" type="tel" maxLength={10} {...register('mobile')} />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="address">{t('common.address')}</label>
              <input id="address" className="input" {...register('address')} />
            </div>
            <div>
              <label className="label" htmlFor="subscription_amount">{t('editCustomer.subscriptionAmount')}</label>
              <input id="subscription_amount" className="input" type="number" min="0"
                {...register('subscription_amount', { min: 0 })} />
            </div>
            <div>
              <label className="label">{t('customers.mealPlan')}</label>
              <div className="input flex items-center" style={{ background: 'rgba(242, 235, 227, 0.5)' }}>
                {getMealPlanLabel(customer.meal_plan)}
                <span className="ml-2 text-xs" style={{ color: 'var(--text-faint)' }}>{t('editCustomer.cannotChange')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <Save className="h-4 w-4" />}
              {loading ? t('editCustomer.saving') : t('editCustomer.saveChanges')}
            </button>
            <button className="btn-secondary" type="button" onClick={() => navigate(`/customers/${id}`)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>

      <CameraCapture
        isOpen={cameraOpen}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />
    </BusinessShell>
  );
}
