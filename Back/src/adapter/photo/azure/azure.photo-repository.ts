import { DeviceId } from "@/core/domain";
import { DevicePhotoRepository } from "@/core/repository";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const AZURE_STORAGE_ACCOUNT = Bun.env.AZURE_STORAGE_ACCOUNT || "pds006"
const AZURE_STORAGE_KEY = Bun.env.AZURE_STORAGE_KEY
const AZURE_CONTAINER_NAME = Bun.env.AZURE_CONTAINER_NAME || "device-photos"

export class AzurePhotoRepository implements DevicePhotoRepository {
  private blobServiceClient: BlobServiceClient
  private containerClient

  constructor() {
    if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY) {
      throw new Error("Azure Storage credentials are not configured. Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables.")
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      AZURE_STORAGE_ACCOUNT,
      AZURE_STORAGE_KEY
    )

    this.blobServiceClient = new BlobServiceClient(
      `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
      sharedKeyCredential
    )

    this.containerClient = this.blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME)
    this.initializeContainer()
  }

  private async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: "blob" // Permite acceso público de lectura a los blobs
      })
    } catch (error) {
      console.error("Error initializing Azure container:", error)
    }
  }

  async savePhoto(file: File, id: DeviceId): Promise<URL> {
    const extension = this.getFileExtension(file)
    if (!extension) {
      throw new Error("Invalid file: no extension found")
    }

    const blobName = `${id}.${extension}`
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName)

    try {
      // Convertir el File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Subir el archivo a Azure Blob Storage
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: file.type
        }
      })

      // Retornar la URL pública del blob
      return new URL(blockBlobClient.url)
    } catch (error) {
      console.error("Error uploading photo to Azure:", error)
      throw new Error("Failed to upload photo to Azure Blob Storage")
    }
  }

  getFileExtension(file: File): string | undefined {
    const parts = file.name.split('.');

    if (parts.length > 1) {
      return parts.pop();
    }

    return undefined;
  }

  /**
   * Método opcional para eliminar una foto
   */
  async deletePhoto(id: DeviceId): Promise<boolean> {
    try {
      const blobs = this.containerClient.listBlobsFlat({
        prefix: id
      })

      for await (const blob of blobs) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blob.name)
        await blockBlobClient.delete()
      }

      return true
    } catch (error) {
      console.error("Error deleting photo from Azure:", error)
      return false
    }
  }

  /**
   * Método opcional para obtener la URL de una foto existente
   */
  async getPhotoUrl(id: DeviceId, extension: string = "png"): Promise<URL | null> {
    const blobName = `${id}.${extension}`
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName)

    try {
      const exists = await blockBlobClient.exists()
      if (exists) {
        return new URL(blockBlobClient.url)
      }
      return null
    } catch (error) {
      console.error("Error checking photo existence:", error)
      return null
    }
  }
}