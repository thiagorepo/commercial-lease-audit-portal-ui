import { supabase } from './supabase';

export async function uploadFile(file: File, bucket: string = 'projects', path?: string): Promise<{ url: string; path: string } | null> {
  try {
    const filePath = path || `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

export async function listFiles(bucket: string, path: string = ''): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List failed:', error);
    return [];
  }
}
