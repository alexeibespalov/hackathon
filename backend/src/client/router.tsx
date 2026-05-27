import { createBrowserRouter } from 'react-router-dom';

import { DashboardPage } from './pages/dashboard-page';
import { NotFoundPage } from './pages/not-found-page';
import { ProductsPage } from './pages/products-page';
import { SchedulesPage } from './pages/schedules-page';
import { SlotGenerationPage } from './pages/slot-generation-page';
import { SystemPage } from './pages/system-page';
import { AppShell } from './shell/app-shell';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <AppShell />,
		children: [
			{ index: true, element: <DashboardPage /> },
			{ path: 'products', element: <ProductsPage /> },
			{ path: 'schedules', element: <SchedulesPage /> },
			{ path: 'slot-generation', element: <SlotGenerationPage /> },
			{ path: 'system', element: <SystemPage /> },
			{ path: '*', element: <NotFoundPage /> },
		],
	},
]);