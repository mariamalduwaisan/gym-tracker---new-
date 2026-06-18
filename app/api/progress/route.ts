import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseClient } from '@/lib/server-client'

export async function GET(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data, error } = await client
    .from('progress_metrics')
    .select('*')
    .order('recorded_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await client
    .from('progress_metrics')
    .insert([{ ...body, user_id: user.id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
