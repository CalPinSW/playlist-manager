import { FC } from 'react';
import { AlbumInfo as IAlbumInfo } from '../../../utils/interfaces/AlbumInfo/AlbumInfo';

interface AlbumInfoProps {
  albumInfo: IAlbumInfo;
}

const AlbumInfo: FC<AlbumInfoProps> = async ({ albumInfo }) => {
  if (!albumInfo.summary_html && !albumInfo.summary) return null;
  return (
    <div>
      {albumInfo.summary_html ? (
        <div dangerouslySetInnerHTML={{ __html: albumInfo.summary_html }} />
      ) : (
        <div>{albumInfo.summary}</div>
      )}
    </div>
  );
};

export default AlbumInfo;
