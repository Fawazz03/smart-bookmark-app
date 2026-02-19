"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

export default function BookmarkList({
  initialBookmarks,
  userId,
}: {
  initialBookmarks: Bookmark[];
  userId: string;
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from("bookmarks").insert({
      title: title.trim(),
      url: normalizedUrl,
      user_id: userId,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setTitle("");
      setUrl("");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace("www.", "");
    } catch {
      return urlStr;
    }
  };

  return (
    <div>
      {/* Add form */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Bookmark</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="URL (e.g. example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-[2] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            {loading ? "Adding..." : "Add Bookmark"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Bookmark list */}
      <div>
        {bookmarks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl block mb-4">🔖</span>
            <p className="text-lg">No bookmarks yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">{bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}</p>
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 group hover:shadow-md transition-shadow"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                  alt=""
                  className="w-6 h-6 rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-800 hover:text-blue-600 transition-colors block truncate"
                  >
                    {bookmark.title}
                  </a>
                  <span className="text-xs text-gray-400 truncate block">{getDomain(bookmark.url)}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-300 hidden sm:block">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete bookmark"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
