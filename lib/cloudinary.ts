const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;

type SignatureResponse = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

export async function getUploadSignature(
  folder?: string
): Promise<SignatureResponse> {
  // Usar la función api.post() que maneja autenticación automáticamente
  const { api } = await import("./api");
  return api.post<SignatureResponse>("/cloudinary/signature", { folder });
}

export async function uploadToCloudinary(
  file: File,
  opts?: { folder?: string; onProgress?: (p: number) => void }
) {
  const { folder, onProgress } = opts || {};
  const sig = await getUploadSignature(folder);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const cloudName = sig.cloudName || CLOUD_NAME;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ url: string; public_id: string }>(
    (resolve, reject) => {
      xhr.open("POST", url);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve({ url: json.secure_url, public_id: json.public_id });
          } catch (e) {
            reject(e);
          }
        } else {
          let detail: string | undefined;
          try {
            const json = JSON.parse(xhr.responseText);
            detail = json?.error?.message;
          } catch {}
          reject(
            new Error(
              `Cloudinary upload failed: ${xhr.status}${
                detail ? ` - ${detail}` : ""
              }`
            )
          );
        }
      };
      xhr.onerror = () =>
        reject(new Error("Network error during Cloudinary upload"));
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.send(formData);
    }
  );

  return promise;
}
