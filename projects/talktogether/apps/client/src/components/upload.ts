import { api } from "src/boot/di";

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const uploadResponse = await api.post('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  if (uploadResponse.status !== 200) {
    console.error("Error uploading image: " + uploadResponse.statusText);
    alert("Error uploading image: " + uploadResponse.statusText);
    return;
  }
  const data = uploadResponse.data as { filename: string }[]
  return data[0]?.filename;
}
