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
