import AccountForm from './account-form';
import { createClient } from '@/utils/supabase/server';

export default async function Account() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          👤 アカウント情報
        </h1>

        <AccountForm user={user} />
      </div>
    </div>
  );
}
