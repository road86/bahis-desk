import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { log } from '../helpers/log';
import { Loading } from './Loading';

const encodeAdministrativeRegion = (administrativeRegionID) => {
    const encodedAdministrativeRegionID = administrativeRegionID * 42;
    const bufferedAdministrativeRegionID = encodedAdministrativeRegionID.toString().padStart(12, '0');
    const encodedAdministrativeRegion = bufferedAdministrativeRegionID
        .split('')
        .map((char) => String.fromCharCode(66 + parseInt(char)))
        .join('');
    return encodedAdministrativeRegion;
};

export const IFrame = () => {
    const [externalUrl, setExternalURL] = useState<string | null>();
    const [encodedAdministrativeRegion, setEncodedAdministrativeRegion] = useState<string>();
    const [completeURL, setCompleteURL] = useState<string>();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const administrativeRegion = 309328; // FIXME make not hardcoded
        setEncodedAdministrativeRegion(encodeAdministrativeRegion(administrativeRegion));
    }, []);

    useEffect(() => {
        if (searchParams.get('url')) {
            setExternalURL(searchParams.get('url'));
        }
    }, [searchParams]);

    useEffect(() => {
        setCompleteURL(`${externalUrl}${encodedAdministrativeRegion}`);
        log.info(`loading IFrame for url: ${JSON.stringify(`${externalUrl}${encodedAdministrativeRegion}`)}`);
    }, [externalUrl, encodedAdministrativeRegion]);

    if (completeURL) {
        return <iframe src={completeURL} style={{ width: '95%', height: '85vh', margin: '2.5%' }}></iframe>;
    } else {
        return <Loading />;
    }
};
