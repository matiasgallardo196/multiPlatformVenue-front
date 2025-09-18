const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  const res = await fetch(`${API_BASE_URL}/cloudinary/signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json();
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

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

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
          reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
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
