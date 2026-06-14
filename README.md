# TrackBook

**The Digital Register for Indian Tiffin & Mess Businesses**

TrackBook replaces your manual notebook with a clean digital system. Track customers, record payments, manage meal pauses, and send WhatsApp reminders — all from your phone.

## Features

- **Customer Management** — Add customers with name, mobile, address, meal plan, and subscription details
- **Payment Recording** — Record cash, UPI, or bank payments. Auto-renew on full payment
- **Meal Pause Tracking** — Track paused days and extend subscriptions automatically
- **Due & Overdue Alerts** — See who needs to pay at a glance
- **WhatsApp Reminders** — Send pre-filled payment reminders via WhatsApp
- **Revenue Dashboard** — Monthly collection charts and business stats
- **CSV Data Export** — Export all customer data for accounting

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI**: Mobile-first warm saffron theme

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/setup_prd.sql` in SQL Editor
3. Disable email confirmation: Authentication → Providers → Email → Uncheck "Confirm email"
4. Copy `.env.example` to `.env` and add your Supabase URL + anon key
5. `npm install && npm run dev`

## Admin Setup

1. Register at `/register`
2. In Supabase SQL Editor: `INSERT INTO public.admins (user_id) VALUES ('<your-user-uuid>');`
3. Approve your business: `UPDATE public.businesses SET status = 'active' WHERE id = '<your-user-uuid>';`
