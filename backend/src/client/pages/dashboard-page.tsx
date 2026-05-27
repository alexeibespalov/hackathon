const highlights = [
	{ label: 'Products ready', value: '0', detail: 'Create Parking, Fast Track, and Lounge products before building schedules.' },
	{ label: 'Schedules at risk', value: '0', detail: 'We will flag invalid time ranges, duration/interval conflicts, and missing timezones here.' },
	{ label: 'Future slot coverage', value: '0 days', detail: 'Replace-mode generation will show protected conflicts before it touches any window.' },
];

export function DashboardPage() {
	return (
		<div className="space-y-6">
			<section className="grid gap-4 xl:grid-cols-3">
				{highlights.map((item) => (
					<div key={item.label} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
						<p className="mono text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
						<p className="mt-4 text-4xl font-semibold tracking-tight text-white">{item.value}</p>
						<p className="mt-4 text-sm leading-6 text-slate-300">{item.detail}</p>
					</div>
				))}
			</section>

			<section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
				<div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
					<p className="mono text-xs uppercase tracking-[0.28em] text-cyan-300/80">Launch Order</p>
					<ol className="mt-5 space-y-4 text-sm text-slate-200">
						<li className="rounded-2xl border border-white/6 bg-slate-900/50 px-4 py-4">1. Define products with capacity, slot duration, and timezone.</li>
						<li className="rounded-2xl border border-white/6 bg-slate-900/50 px-4 py-4">2. Link recurring schedules to each product and preview validation issues.</li>
						<li className="rounded-2xl border border-white/6 bg-slate-900/50 px-4 py-4">3. Generate or replace slot windows with protection against destructive overlap.</li>
					</ol>
				</div>

				<div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5">
					<p className="mono text-xs uppercase tracking-[0.28em] text-amber-300">Guardrails</p>
					<ul className="mt-5 space-y-3 text-sm leading-6 text-amber-50">
						<li>Interval shorter than duration is blocked.</li>
						<li>Regeneration must erase a target window explicitly.</li>
						<li>Booked or waitlisted slots will be treated as protected data.</li>
						<li>Timezone is part of operational correctness, not decoration.</li>
					</ul>
				</div>
			</section>
		</div>
	);
}