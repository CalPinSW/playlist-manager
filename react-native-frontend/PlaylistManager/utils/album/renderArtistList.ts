import { Artist } from "../../interfaces/Artist";

export const renderArtistList = (artists: Artist[]): string  => artists.map((artist) => artist.name).join(", ");
