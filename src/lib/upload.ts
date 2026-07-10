import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

const BUCKET = 'avatars';

/** Abre a galeria e devolve a URI da imagem escolhida (ou undefined se cancelar). */
export async function pickImage(): Promise<string | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return undefined;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return result.canceled ? undefined : result.assets[0]?.uri;
}

/** Sobe a imagem para o Storage e devolve a URL pública. */
export async function uploadImage(localUri: string, folder: string): Promise<string> {
  const arrayBuffer = await fetch(localUri).then((response) => response.arrayBuffer());
  const path = `${folder}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
  });
  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
