import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseClient } from '@/lib/server-client'

export async function GET(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { searchParams } = new URL(req.url)
  const exerciseId = searchParams.get('exercise_id')

  let query = client
    .from('exercise_logs')
    .select('*')
    .order('logged_at', { ascending: false })
  if (exerciseId) query = query.eq('exercise_id', exerciseId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const body = await req.json()
  const { data, error } = await client
    .from('exercise_logs')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
