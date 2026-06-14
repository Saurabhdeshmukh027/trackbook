const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const USER_EMAIL = 'saumyadeshmukh027@gmail.com';

async function main() {
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === USER_EMAIL);

  if (user) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    if (error) console.error('Error confirming:', error.message);
    else console.log('✅ Email manually confirmed for', USER_EMAIL);
  } else {
    console.log('User not found.');
  }
}

main();
