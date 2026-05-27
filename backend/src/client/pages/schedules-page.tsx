const protections = [
	'Valid day-of-week selections only',
	'End time must be later than start time',
	'Interval must not be shorter than product duration',
	'Timezone must be explicit before schedule activation',
];

export function SchedulesPage() {
	return (
		<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
			<section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<h3 className="text-2xl font-semibold tracking-tight text-white">Schedules</h3>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
					Recurring schedules will be attached to products, validated before save, and previewed before slot generation touches live windows.
				</p>
				<div className="mt-6 rounded-3xl border border-white/8 bg-slate-900/60 p-5 text-sm leading-7 text-slate-300">
					No schedules exist yet. The CAP-12 form will live here with day pickers, effective date ranges, and conflict previews.
				</div>
			</section>

			<aside className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5">
				<p className="mono text-xs uppercase tracking-[0.28em] text-cyan-200">Validation model</p>
				<ul className="mt-5 space-y-3 text-sm leading-6 text-cyan-50">
					{protections.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</aside>
		</div>
	);
}