export type Post = {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  session_id?: string | null;
  is_instructor?: boolean;
  created_at: string;
  parent_id: string | null;
  replies?: Post[];
};

export type Notification = {
  id: string;
  user_session_id: string | null;
  target_role: "instructor" | "user";
  post_id: string;
  actor_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
