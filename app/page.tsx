import { createClient } from "@/lib/supabase/server";
import BookmarkList from "@/components/BookmarkList";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, just show empty state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">
          Please login to view your bookmarks
        </h1>
      </div>
    );
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔖</span>
            <h1 className="text-xl font-bold text-gray-800">
              Bookmark Manager
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <BookmarkList
          initialBookmarks={bookmarks || []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
