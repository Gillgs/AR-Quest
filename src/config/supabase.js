import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a Supabase client with the service role key for admin operations
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  }
}) : null

// Create a signed URL for a storage object. If service role client is available
// we'll use it to create a time-limited signed URL. Otherwise fall back to
// the public url (useful for public buckets).
export async function createSignedUrl(bucketName, objectPath, expiresInSeconds = 60) {
  if (!objectPath) return null
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(objectPath, expiresInSeconds)

      if (error) throw error
      return data?.signedUrl || null
    }

    // Fallback: public URL using the client-side anon key
    const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath)
    return data?.publicUrl || null
  } catch (err) {
    console.error('createSignedUrl error:', err)
    return null
  }
}

// Securely delete a file from a bucket. This uses the admin client and first
// verifies that the provided userId has that objectPath recorded in the
// specified table before removing it. This prevents arbitrary deletions.
export async function secureDeleteFile(bucketName, objectPath, userId, table = 'user_profiles') {
  if (!supabaseAdmin) {
    throw new Error('Admin client not configured for secure delete')
  }
  if (!objectPath) return { error: null, removed: false }

  // Verify DB record matches the file path for this user
  const { data: record, error: selectError } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', userId)
    .eq('profile_picture_url', objectPath)
    .maybeSingle()

  if (selectError) {
    return { error: selectError }
  }

  if (!record) {
    // Nothing to delete (either mismatch or record not found)
    return { error: null, removed: false }
  }

  // Remove the object
  const { error: removeError } = await supabaseAdmin.storage.from(bucketName).remove([objectPath])
  if (removeError) return { error: removeError, removed: false }
  return { error: null, removed: true }
}
