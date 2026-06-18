import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseClient } from '@/lib/server-client'

export async function GET(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { searchParams } = new URL(req.url)
  const workoutId = searchParams.get('workout_id')

  let query = client
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: true })
  if (workoutId) query = query.eq('workout_id', workoutId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const body = await req.json()
  const { data, error } = await client
    .from('exercises')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await client.from('exercises').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
