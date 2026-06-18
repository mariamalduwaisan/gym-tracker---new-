import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseClient } from '@/lib/server-client'

export async function GET(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { searchParams } = new URL(req.url)
  const priority = searchParams.get('priority')
  const status   = searchParams.get('status')

  let query = client
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false })

  if (priority && priority !== 'all') query = query.eq('priority', priority)
  if (status   && status   !== 'all') query = query.eq('status',   status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await client
    .from('workouts')
    .insert([{ ...body, user_id: user.id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  // Ownership check: RLS SELECT only returns rows owned by this user,
  // so no row → not owner (or doesn't exist) → 403
  const { data: existing } = await client
    .from('workouts').select('id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Strip user_id from updates so it can never be reassigned
  const { user_id: _dropped, ...safeUpdates } = updates
  const { data, error } = await client
    .from('workouts')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Ownership check: same pattern — RLS hides rows not owned by this user
  const { data: existing } = await client
    .from('workouts').select('id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await client.from('workouts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
