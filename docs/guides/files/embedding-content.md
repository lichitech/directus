# Embedding External Content

In addition to uploading files directly, Directus allows you to "embed" external web content. This creates a file entry that references a URL, such as a YouTube video, a tweet, or an online article, without downloading and storing the actual file on your storage adapter.

Instead, Directus fetches rich metadata from the URL—including titles, descriptions, and thumbnails—using oEmbed and OpenGraph standards, and stores this information in the `directus_files` collection.

This is useful for managing and displaying external media within your projects just like any other file asset.

## How to Embed Content

You can embed content directly from the File Manager in the Directus App.

1. Navigate to the File Manager.
2. Click the "Add File" button in the top-right corner.
3. In the upload dialog, click the "Import from URL" (<v-icon name="link" />) button, and then select the "Import Embedded Content from URL" (<v-icon name="code" />) button.
4. A dialog will appear asking for a URL. Paste the URL of the content you wish to embed (e.g., a YouTube video URL).
5. Click "Import".

Directus will then fetch the metadata from the URL and create a new file item in the current folder. This item will have a type of `embed/video`, `embed/rich`, etc., and will display a preview based on the fetched thumbnail.

## API Usage

You can also embed content programmatically via the API by using the `POST /files/import` endpoint. To do so, include the `isEmbed: true` flag in your request payload.

**Request Body:**

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "isEmbed": true,
  "data": {
    "title": "My Favorite Video",
    "folder": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
  }
}
```

**Response:**

The API will respond with the newly created file object, which will contain the extracted metadata. The `filename_disk` field will be `null`, and the `type` will be prefixed with `embed/`. The original URL is stored in the `embed` field.
