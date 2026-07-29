export type Post = {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  is_instructor?: boolean;
  created_at: string;
  parent_id: string | null;
  replies?: Post[];
};
