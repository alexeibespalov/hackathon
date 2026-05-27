const checklist = [
	{ label: 'Worker + API shell', status: 'Ready' },
	{ label: 'React manager shell', status: 'Ready' },
	{ label: 'Local D1 schema', status: 'Applied' },
	{ label: 'Remote D1 schema', status: 'Blocked by network certificate issue' },
];

export function SystemPage() {
	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<h3 className="text-2xl font-semibold tracking-tight text-white">System</h3>
				<p className="mt-2 text-sm leading-6 text-slate-300">
					This page keeps the infrastructure reality visible while the product workflows are still being built.
				</p>
				<div className="mt-6 space-y-3">
					{checklist.map((item) => (
						<div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-900/50 px-4 py-4">
							<span className="text-sm text-slate-200">{item.label}</span>
							<span className="mono text-xs uppercase tracking-[0.28em] text-cyan-200">{item.status}</span>
						</div>
					))}
				</div>
			</section>

			<aside className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<p className="mono text-xs uppercase tracking-[0.28em] text-slate-400">Next implementation slice</p>
				<p className="mt-4 text-lg font-medium text-white">CAP-12: products and schedules CRUD</p>
				<p className="mt-3 text-sm leading-6 text-slate-300">
					The shell is ready for real data. The next step is aligning the schema to camelCase with timezone support, then wiring products and schedules through the new API seams.
				</p>
			</aside>
		</div>
	);
}