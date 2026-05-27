import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
	{ label: 'Dashboard', to: '/' },
	{ label: 'Products', to: '/products' },
	{ label: 'Schedules', to: '/schedules' },
	{ label: 'Slot Generation', to: '/slot-generation' },
	{ label: 'System', to: '/system' },
];

export function AppShell() {
	return (
		<div className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_22px_80px_rgba(2,6,23,0.45)] backdrop-blur">
					<div className="mb-10">
						<p className="mono text-xs uppercase tracking-[0.35em] text-cyan-300/80">Airport Booking</p>
						<h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Manager Deck</h1>
						<p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
							Configure products, build schedules, and control slot generation from one place.
						</p>
					</div>

					<nav className="space-y-2">
						{navigation.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === '/'}
								className={({ isActive }) =>
									[
										'group flex items-center justify-between rounded-2xl border px-4 py-3 transition',
										isActive
											? 'border-cyan-400/60 bg-cyan-400/10 text-white'
											: 'border-white/5 bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white',
									].join(' ')
								}
							>
								<span className="font-medium">{item.label}</span>
								<span className="mono text-xs text-slate-400 group-hover:text-slate-200">route</span>
							</NavLink>
						))}
					</nav>

					<div className="mt-10 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
						<p className="mono text-xs uppercase tracking-[0.3em] text-amber-300">Focus</p>
						<p className="mt-2 text-sm leading-6 text-amber-50">
							Configuration-first MVP: products, schedules, protected slot regeneration, and system status.
						</p>
					</div>
				</aside>

				<div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-[0_22px_80px_rgba(2,6,23,0.35)] backdrop-blur sm:p-6">
					<header className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="mono text-xs uppercase tracking-[0.35em] text-cyan-300/80">Operations Console</p>
							<h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Airport services configuration</h2>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<StatCard label="Timezone model" value="Product-level" accent="cyan" />
							<StatCard label="Regeneration mode" value="Replace window" accent="amber" />
						</div>
					</header>

					<main>
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}

function StatCard({ accent, label, value }: { accent: 'amber' | 'cyan'; label: string; value: string }) {
	const accentClass = accent === 'cyan' ? 'text-cyan-200 border-cyan-400/30 bg-cyan-400/10' : 'text-amber-100 border-amber-400/30 bg-amber-400/10';

	return (
		<div className={`rounded-2xl border px-4 py-3 ${accentClass}`}>
			<p className="mono text-[11px] uppercase tracking-[0.3em] text-slate-300">{label}</p>
			<p className="mt-2 text-sm font-medium">{value}</p>
		</div>
	);
}