# InfiMagen — AI Content Platform

## Setup

1. **Supabase** — SQL Editor mein `SUPABASE_COMPLETE.sql` run karo
2. **`.env.local`** — `.env.example` se copy karke values bharo
3. **Deploy** — `npm install && npm run dev` ya Vercel pe push karo

## Features
- AI Image Generation (Imagen 4)
- B-Roll Video (Pexels)
- Thumbnail Creator (16:9)
- Script Generator
- Text to Speech
- Credit System + Razorpay payments
- Admin Panel

## Admin Setup
After signup, run in Supabase SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
