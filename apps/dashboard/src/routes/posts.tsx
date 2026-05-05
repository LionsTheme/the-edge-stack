import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const Route = createFileRoute("/posts")({
  component: PostsComponent,
});

function PostsComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await api.api.posts.$get();
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Posts</h1>
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Posts</h1>
        <p className="text-destructive">Error loading posts: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Posts</h1>
      {data?.posts && data.posts.length > 0 ? (
        <div className="grid gap-4">
          {data.posts.map((post) => (
            <article key={post.id} className="p-4 rounded-lg border bg-card">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-muted-foreground mt-2">{post.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No posts yet. Create one via the API!
        </p>
      )}
    </div>
  );
}