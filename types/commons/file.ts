export interface FileItem {
    id: number
    file_name: string
    file_url: string|null
    type: string
    size: number
    lastModified: number
    file_ext: string
}