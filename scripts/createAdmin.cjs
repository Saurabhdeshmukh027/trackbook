/**
 * Create super admin in TrackBook
 * Usage: node scripts/createAdmin.cjs
 */
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const ADMIN_EMAIL = 'saumyadeshmukh027@gmail.com';

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Find user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error fetching users:', listError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email === ADMIN_EMAIL);
  if (!user) {
    console.error(`❌ User ${ADMIN_EMAIL} not found. Register first at /register`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  // Insert into admins table
  const { error: insertError } = await supabase
    .from('admins')
    .insert({ user_id: user.id, email: user.email })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      console.log('✅ User is already an admin');
    } else {
      console.error('❌ Error creating admin:', insertError.message);
      process.exit(1);
    }
  } else {
    console.log(`✅ Admin access granted to ${user.email}`);
  }

  console.log('   User must sign out and sign back in for changes to take effect.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
