import { log } from '../helpers/log';

interface IFrameProps {
    external_url: string;
}

const encodeUpazila = (upazillaID) => {
    const encodedUpazillaID = upazillaID * 42;
    const bufferedUpazillaID = encodedUpazillaID.toString().padStart(12, '0');
    const encodedUpazila = bufferedUpazillaID
        .split('')
        .map((char) => String.fromCharCode(66 + parseInt(char)))
        .join('');
    return encodedUpazila;
};

export const IFrame = (props: IFrameProps) => {
    log.info('loading IFrame');
    log.info(JSON.stringify(props));
    const upazila = ''; //props.upazila; // FIXME
    const encodedUpazila = encodeUpazila(upazila);
    const external_url = new URLSearchParams((props as any).location.search).get('url') || '';
    const url = `${external_url}${encodedUpazila}`;
    log.info(`loading IFrame for url: ${JSON.stringify(url)}`);

    return (
        <>
            <div style={{ width: '100%', height: '95vh', maxHeight: '100%' }} id="IFrame-iframe">
                <iframe src={url} style={{ width: '95%', height: '90vh', margin: '2.5%' }} title="IFrame"></iframe>
            </div>
        </>
    );
};
