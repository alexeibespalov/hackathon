const steps = [
	'Select the product or schedule that owns the target window.',
	'Choose the date range to generate or replace.',
	'Preview how many slots will be created, skipped, or blocked as protected.',
	'Confirm replacement only after the protection checks pass.',
];

export function SlotGenerationPage() {
	return (
		<div className="space-y-6">
			<section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<h3 className="text-2xl font-semibold tracking-tight text-white">Slot generation</h3>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
					Regeneration is explicit replace-mode work. Existing slots in the selected window are erased first, but only when the service confirms there are no protected bookings or waitlist entries in the blast radius.
				</p>
				<div className="mt-6 grid gap-4 lg:grid-cols-2">
					<div className="rounded-3xl border border-white/8 bg-slate-900/60 p-5">
						<p className="mono text-xs uppercase tracking-[0.28em] text-slate-400">Workflow</p>
						<ol className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
							{steps.map((step) => (
								<li key={step}>{step}</li>
							))}
						</ol>
					</div>

					<div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-5">
						<p className="mono text-xs uppercase tracking-[0.28em] text-rose-200">Protected window rules</p>
						<ul className="mt-4 space-y-3 text-sm leading-6 text-rose-50">
							<li>Do not replace slots that already have bookings.</li>
							<li>Do not replace slots with active waitlist entries.</li>
							<li>Do not run concurrent replacement for the same product/date range.</li>
						</ul>
					</div>
				</div>
			</section>
		</div>
	);
}