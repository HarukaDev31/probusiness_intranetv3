export interface FileItem {
    id: number
    file_name: string
    file_url: string|null
    type: string
    size: number
    lastModified: number
    file_ext: string
    /** MIME para reproductor (p. ej. video/mp4 desde inbox). */
    content_type?: string | null
}