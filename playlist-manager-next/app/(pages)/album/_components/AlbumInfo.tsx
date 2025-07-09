import { FC } from 'react';
import { AlbumInfo as IAlbumInfo } from '../../../utils/interfaces/AlbumInfo/AlbumInfo';

interface AlbumInfoProps {
  albumInfo: IAlbumInfo;
}

const AlbumInfo: FC<AlbumInfoProps> = async ({ albumInfo }) => {
  if (!albumInfo.summary && !albumInfo.summary_html) return null;
  return (
    <div>
      {albumInfo ? (
        <div dangerouslySetInnerHTML={{ __html: albumInfo.summary_html }}></div>
      ) : (
        <div>{albumInfo.summary}</div>
      )}
    </div>
  );
};

export default AlbumInfo;
