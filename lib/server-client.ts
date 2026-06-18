import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export function makeSupabaseClient(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    auth ? { global: { headers: { Authorization: auth } } } : {}
  )
}
