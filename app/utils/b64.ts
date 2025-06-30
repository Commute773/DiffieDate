// Encode Uint8Array to base64 string
export function encodeBase64(arr: Uint8Array): string {
  // Convert Uint8Array to string of bytes
  let binary = "";
  arr.forEach((byte) => (binary += String.fromCharCode(byte)));
  // Use btoa to encode
  return btoa(binary);
}

// Decode base64 string to Uint8Array
export function decodeBase64(str: string): Uint8Array {
  const binary = atob(str);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}
