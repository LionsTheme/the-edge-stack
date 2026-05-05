import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts')({
  component: PostsComponent,
});

function PostsComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Posts</h1>
      <p className="text-muted-foreground">
        Your posts will appear here. Connect to the API to fetch real data.
      </p>
    </div>
  );
}