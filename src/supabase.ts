import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vfckdxjhogghrpywyrjo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmY2tkeGpob2dnaHJweXd5cmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDcyNTcsImV4cCI6MjA2OTYyMzI1N30.dEj2BH9N5m64tYNi6mbjERbUvVE8cNbqOcGNx7DTn74'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Template type definition
export interface Template {
  id: number
  name: string
  html: string
  preview_image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  last_generated_html: string | null
  last_generated_at: string | null
}


