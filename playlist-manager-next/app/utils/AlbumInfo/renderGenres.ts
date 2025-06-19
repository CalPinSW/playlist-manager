import { GenreInfo } from '../interfaces/AlbumInfo/AlbumInfo';

const renderGenres = (genres: GenreInfo[]): string => {
  return genres
    .sort((t1, t2) => t2.count - t1.count)
    .slice(0, 5)
    .map(tag => tag.name)
    .join(', ');
};

export default renderGenres;
