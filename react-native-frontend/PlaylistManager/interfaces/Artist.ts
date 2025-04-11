import { Image } from "./Image";

export interface Artist {
    genres?: string[]
    id: string
    images?: Image[]
    name: string
    popularity?: number
    uri: string
}