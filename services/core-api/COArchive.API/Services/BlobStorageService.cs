using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace COArchive.API.Services
{
    public class BlobStorageService
    {
        private const string ProfileImagesContainer = "profile-images";
        private const string ProgramPdfsContainer = "program-pdfs";

        private readonly BlobServiceClient _blobServiceClient;
        private readonly ILogger<BlobStorageService> _logger;

        public BlobStorageService(BlobServiceClient blobServiceClient, ILogger<BlobStorageService> logger)
        {
            _blobServiceClient = blobServiceClient;
            _logger = logger;
        }

        public async Task<string> UploadProfileImageAsync(Stream fileStream, string fileName, string contentType)
        {
            return await UploadAsync(ProfileImagesContainer, fileStream, fileName, contentType);
        }

        public async Task<string> UploadProgramPdfAsync(Stream fileStream, string fileName, string contentType)
        {
            return await UploadAsync(ProgramPdfsContainer, fileStream, fileName, contentType);
        }

        private async Task<string> UploadAsync(string containerName, Stream fileStream, string fileName, string contentType)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Prefix with a GUID to avoid collisions/overwrites on identical filenames
            var blobName = $"{Guid.NewGuid()}_{fileName}";
            var blobClient = containerClient.GetBlobClient(blobName);

            var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };

            await blobClient.UploadAsync(fileStream, new BlobUploadOptions
            {
                HttpHeaders = blobHttpHeaders
            });

            _logger.LogInformation("Uploaded blob {BlobName} to container {ContainerName}", blobName, containerName);

            return blobClient.Uri.ToString();
        }
    }
}