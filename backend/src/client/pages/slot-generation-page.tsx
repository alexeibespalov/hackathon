import { useEffect, useMemo, useState } from 'react';

import { generateSlots, getProducts, previewSlots } from '../lib/api';
import type { ProductSummary, SlotGenerationPlan } from '../../types';

const steps = [
	'Select the product or schedule that owns the target window.',
	'Choose the date range to generate or replace.',
	'Preview how many slots will be created, skipped, or blocked as protected.',
	'Confirm replacement only after the protection checks pass.',
];

function addDays(baseDate: string, days: number) {
	const date = new Date(`${baseDate}T12:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);

	return date.toISOString().slice(0, 10);
}

export function SlotGenerationPage() {
	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
	const [products, setProducts] = useState<ProductSummary[]>([]);
	const [productId, setProductId] = useState('');
	const [fromDate, setFromDate] = useState(today);
	const [toDate, setToDate] = useState(addDays(today, 6));
	const [replaceExisting, setReplaceExisting] = useState(true);
	const [plan, setPlan] = useState<SlotGenerationPlan | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let active = true;

		void (async () => {
			const availableProducts = await getProducts();

			if (active) {
				setProducts(availableProducts);
				setProductId(availableProducts[0]?.id ?? '');
			}
		})();

		return () => {
			active = false;
		};
	}, []);

	async function handlePreview() {
		setBusy(true);
		setStatus(null);

		try {
			const nextPlan = await previewSlots({ productId, fromDate, toDate, replaceExisting });
			setPlan(nextPlan);
			setStatus('Preview ready.');
		} catch (error) {
			setStatus(error instanceof Error ? error.message : 'Preview failed.');
		} finally {
			setBusy(false);
		}
	}

	async function handleGenerate() {
		setBusy(true);
		setStatus(null);

		try {
			const nextPlan = await generateSlots({ productId, fromDate, toDate, replaceExisting });
			setPlan(nextPlan);
			setStatus('Slots generated successfully.');
		} catch (error) {
			setStatus(error instanceof Error ? error.message : 'Generation failed.');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<h3 className="text-2xl font-semibold tracking-tight text-white">Slot generation</h3>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
					Regeneration is explicit replace-mode work. Existing slots in the selected window are erased first, but only when the service confirms there are no protected bookings or waitlist entries in the blast radius.
				</p>
				<div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="rounded-3xl border border-white/8 bg-slate-900/60 p-5">
						<p className="mono text-xs uppercase tracking-[0.28em] text-slate-400">Generation console</p>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<label className="text-sm text-slate-200">
								<span className="mb-2 block text-slate-400">Product</span>
								<select className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" value={productId} onChange={(event) => setProductId(event.target.value)}>
									{products.map((product) => (
										<option key={product.id} value={product.id}>{product.name}</option>
									))}
								</select>
							</label>
							<label className="text-sm text-slate-200">
								<span className="mb-2 block text-slate-400">Mode</span>
								<button type="button" className={`w-full rounded-2xl border px-4 py-3 text-left ${replaceExisting ? 'border-amber-400/40 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-slate-950 text-white'}`} onClick={() => setReplaceExisting((current) => !current)}>
									{replaceExisting ? 'Replace existing window' : 'Create missing slots only'}
								</button>
							</label>
							<label className="text-sm text-slate-200">
								<span className="mb-2 block text-slate-400">From</span>
								<input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
							</label>
							<label className="text-sm text-slate-200">
								<span className="mb-2 block text-slate-400">To</span>
								<input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
							</label>
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button className="rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100" disabled={busy || !productId} onClick={() => void handlePreview()}>
								Preview
							</button>
							<button className="rounded-2xl border border-amber-400/40 bg-amber-400/15 px-4 py-3 text-sm font-medium text-amber-100" disabled={busy || !productId} onClick={() => void handleGenerate()}>
								Generate
							</button>
						</div>
						{status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
					</div>

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
						{plan ? (
							<div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-white">
								<p className="mono text-xs uppercase tracking-[0.28em] text-slate-400">Latest plan</p>
								<p className="mt-3">Candidates: {plan.candidateSlots}</p>
								<p>Existing in window: {plan.existingSlots}</p>
								<p>To create: {plan.slotsToCreate}</p>
								<p>To delete: {plan.slotsToDelete}</p>
								<p>Protected slots: {plan.protectedSlots.length}</p>
							</div>
						) : null}
					</div>
				</div>
			</section>
		</div>
	);
}