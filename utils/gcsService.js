// utils/gcsService.js
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
dotenv.config();

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Mengunggah file buffer ke Google Cloud Storage.
 * Membuat file yang diunggah dapat diakses publik (karena bucket sudah diatur publik).
 * @param {Buffer} fileBuffer Buffer data file yang akan diunggah (dari multer.memoryStorage).
 * @param {string} destination Nama/path file di dalam bucket GCS (misal: 'articles/image.jpg').
 * @param {string} contentType Tipe MIME dari file (misal: 'image/jpeg').
 * @returns {Promise<string>} URL publik dari file yang diunggah.
 */
const uploadFileToGCS = async (fileBuffer, destination, contentType) => {
    const blob = bucket.file(destination);

    // Menggunakan blob.save() untuk mengunggah buffer
    await blob.save(fileBuffer, {
        // public: true,     // <<< INI YANG HARUS DIHAPUS ATAU DIKOMENTARI!!!
        contentType: contentType // Menggunakan contentType yang diberikan dari controller
    });

    return `https://storage.googleapis.com/${bucketName}/${destination}`;
};

/**
 * Menghapus file dari Google Cloud Storage.
 * @param {string} destination Nama/path file di dalam bucket GCS.
 * @returns {Promise<void>}
 */
const deleteFileFromGCS = async (destination) => {
    const blob = bucket.file(destination);
    const [exists] = await blob.exists();
    if (exists) {
        await blob.delete();
        console.log(`File ${destination} deleted from GCS.`);
    } else {
        console.warn(`Attempted to delete non-existent file: ${destination}`);
    }
};

/**
 * Mendapatkan URL publik dari file di Google Cloud Storage.
 * Berguna jika kamu hanya menyimpan nama file di DB dan perlu membuat URL-nya.
 * @param {string} destination Nama/path file di dalam bucket GCS.
 * @returns {string} URL publik dari file.
 */
const getPublicUrlGCS = (destination) => {
    return `https://storage.googleapis.com/${bucketName}/${destination}`;
};


export {
    uploadFileToGCS,
    deleteFileFromGCS,
    getPublicUrlGCS
};