import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { ErrorPage } from './components/ErrorPage';
import { Form } from './components/Form';
import { FormDetails } from './components/FormDetails';
import { IFrame } from './components/IFrame';
import { Layout } from './components/Layout';
import { List } from './components/List';
import { Menu } from './components/Menu';
import { SignIn } from './components/SignIn';

export const App = () => {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <Layout hasHeader={false} />,
            children: [
                {
                    path: '/',
                    element: <SignIn />,
                    errorElement: <ErrorPage />,
                },
            ],
        },
        {
            element: <Layout />,
            children: [
                {
                    path: 'menu/:menu_id',
                    element: <Menu />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'form/:form_uid',
                    element: <Form />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'form/draft/:form_uid/:instance_id',
                    element: <Form draft={true} />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'form/details/:form_uid/:instance_id',
                    element: <Form />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'list/:form_uid',
                    element: <List />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'list/draft/:form_uid/',
                    element: <List draft={true} />,
                    errorElement: <ErrorPage />,
                },
                {
                    path: 'iframe',
                    element: <IFrame external_url={'http://localhost:3001/'} />,
                    errorElement: <ErrorPage />,
                },
            ],
        },
        {
            path: '*',
            element: <ErrorPage />,
        },
    ]);

    return <RouterProvider router={router}></RouterProvider>;
};
