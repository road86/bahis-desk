import { Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { SystemAlerts } from './SystemAlerts';

export interface LayoutProps {
    hasHeader?: boolean;
}

export const Layout = (props: LayoutProps) => (
    <>
        {props.hasHeader && <Header />}
        <SystemAlerts />
        <Container sx={{ marginTop: 5 }}>
            <Outlet />
        </Container>
        <Footer />
    </>
);

Layout.defaultProps = {
    hasHeader: true,
};
