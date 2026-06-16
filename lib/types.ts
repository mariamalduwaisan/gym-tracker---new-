export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status   = 'pending' | 'in_progress' | 'completed'

export interface Workout {
  id:             string
  title:          string
  description:    string | null
  status:         Status
  priority:       Priority
  scheduled_date: string
  image_url:      string | null
  created_at:     string
  updated_at:     string
}

export interface Exercise {
  id:            string
  workout_id:    string
  name:          string
  target_sets:   number
  target_reps:   number
  target_weight: number
  created_at:    string
}

export interface ExerciseLog {
  id:          string
  exercise_id: string
  set_number:  number
  reps:        number
  weight:      number
  notes:       string | null
  logged_at:   string
}

export interface ProgressMetric {
  id:           string
  weight_kg:    number | null
  body_fat_pct: number | null
  notes:        string | null
  recorded_at:  string
  created_at:   string
}
