import { useEffect, useMemo, useState } from 'react';

import { createSchedule, deleteSchedule, getProducts, getSchedules, updateSchedule } from '../lib/api';
import type { ProductSummary, ScheduleInput, ScheduleSummary } from '../../types';

const protections = [
	'Valid day-of-week selections only',
	'End time must be later than start time',
	'Interval must not be shorter than product duration',
	'Timezone must be explicit before schedule activation',
];

export function SchedulesPage() {
	const [groups, setGroups] = useState<Array<{ product: ProductSummary; schedules: ScheduleSummary[] }>>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [selectedProductId, setSelectedProductId] = useState('');
	const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
	const [form, setForm] = useState({
		startTime: '05:00',
		endTime: '10:00',
		daysOfWeek: [1, 2, 3, 4, 5],
		validFrom: '2026-05-27',
		validUntil: '',
		slotIntervalMins: '15',
	});

	const products = useMemo(() => groups.map((group) => group.product), [groups]);

	useEffect(() => {
		void refreshSchedules();
	}, []);

	useEffect(() => {
		if (!selectedProductId && products[0]) {
			setSelectedProductId(products[0].id);
		}
	}, [products, selectedProductId]);

	async function refreshSchedules() {
		let active = true;
		setLoading(true);

		try {
			const availableProducts = await getProducts();
			const schedulesByProduct = await Promise.all(
				availableProducts.map(async (product) => ({
					product,
					schedules: await getSchedules(product.id),
				})),
			);

			if (active) {
				setGroups(schedulesByProduct);
			}
		} finally {
			if (active) {
				setLoading(false);
			}
		}

		return () => {
			active = false;
		};
	}

	function resetForm(product?: ProductSummary) {
		setEditingScheduleId(null);
		setForm({
			startTime: '05:00',
			endTime: product?.slotDurationMins === 60 ? '23:00' : '10:00',
			daysOfWeek: product?.slotDurationMins === 60 ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
			validFrom: '2026-05-27',
			validUntil: '',
			slotIntervalMins: String(product?.slotDurationMins ?? 15),
		});
	}

	function beginEdit(schedule: ScheduleSummary) {
		setEditingScheduleId(schedule.id);
		setSelectedProductId(schedule.productId);
		setForm({
			startTime: schedule.startTime,
			endTime: schedule.endTime,
			daysOfWeek: schedule.daysOfWeek,
			validFrom: schedule.validFrom,
			validUntil: schedule.validUntil ?? '',
			slotIntervalMins: String(schedule.slotIntervalMins),
		});
	}

	function toggleDay(day: number) {
		setForm((current) => ({
			...current,
			daysOfWeek: current.daysOfWeek.includes(day)
				? current.daysOfWeek.filter((value) => value !== day)
				: [...current.daysOfWeek, day].sort((left, right) => left - right),
		}));
	}

	function toPayload(): ScheduleInput {
		return {
			startTime: form.startTime,
			endTime: form.endTime,
			daysOfWeek: form.daysOfWeek,
			validFrom: form.validFrom,
			validUntil: form.validUntil || null,
			slotIntervalMins: Number(form.slotIntervalMins),
		};
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedProductId) {
			setStatus('Select a product first.');
			return;
		}

		setSaving(true);
		setStatus(null);

		try {
			if (editingScheduleId) {
				await updateSchedule(editingScheduleId, toPayload());
				setStatus('Schedule updated.');
			} else {
				await createSchedule(selectedProductId, toPayload());
				setStatus('Schedule created.');
			}

			await refreshSchedules();
			const product = products.find((entry) => entry.id === selectedProductId);
			resetForm(product);
		} catch (error) {
			setStatus(error instanceof Error ? error.message : 'Schedule save failed.');
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(scheduleId: string) {
		setSaving(true);
		setStatus(null);

		try {
			await deleteSchedule(scheduleId);
			setStatus('Schedule deleted.');
			await refreshSchedules();
			if (editingScheduleId === scheduleId) {
				const product = products.find((entry) => entry.id === selectedProductId);
				resetForm(product);
			}
		} catch (error) {
			setStatus(error instanceof Error ? error.message : 'Schedule delete failed.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
			<section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
				<h3 className="text-2xl font-semibold tracking-tight text-white">Schedules</h3>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
					Recurring schedules will be attached to products, validated before save, and previewed before slot generation touches live windows.
				</p>
				<div className="mt-6 space-y-4">
					{loading ? (
						<div className="rounded-3xl border border-white/8 bg-slate-900/60 p-5 text-sm text-slate-300">Loading schedules...</div>
					) : (
						groups.map(({ product, schedules }) => (
							<div key={product.id} className="rounded-3xl border border-white/8 bg-slate-900/60 p-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-lg font-medium text-white">{product.name}</p>
										<p className="mt-1 text-sm text-slate-400">{product.location} · {product.timezone}</p>
									</div>
									<span className="mono text-xs uppercase tracking-[0.25em] text-cyan-200">{schedules.length} schedules</span>
								</div>

								{schedules.length === 0 ? (
									<p className="mt-4 text-sm text-slate-300">No schedules yet.</p>
								) : (
									<div className="mt-4 space-y-3">
										{schedules.map((schedule) => (
											<div key={schedule.id} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-slate-200">
												<p className="font-medium text-white">{schedule.startTime} - {schedule.endTime}</p>
												<p className="mt-1 text-slate-400">Days: {schedule.daysOfWeek.join(', ')} · Interval: {schedule.slotIntervalMins} mins</p>
											</div>
										))}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</section>

			<aside className="space-y-6">
				<form className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5" onSubmit={handleSubmit}>
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="mono text-xs uppercase tracking-[0.28em] text-cyan-200">Schedule form</p>
							<p className="mt-2 text-sm leading-6 text-cyan-50">Create or edit a recurring schedule linked to a product.</p>
						</div>
						<button className="rounded-2xl border border-white/20 px-3 py-2 text-xs text-white" onClick={() => resetForm(products.find((entry) => entry.id === selectedProductId))} type="button">
							New
						</button>
					</div>

					<div className="mt-5 space-y-4">
						<label className="block text-sm text-cyan-50">
							<span className="mb-2 block text-cyan-100/80">Product</span>
							<select className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
								<option value="">Select a product</option>
								{products.map((product) => (
									<option key={product.id} value={product.id}>{product.name}</option>
								))}
							</select>
						</label>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block text-sm text-cyan-50">
								<span className="mb-2 block text-cyan-100/80">Start time</span>
								<input className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} />
							</label>
							<label className="block text-sm text-cyan-50">
								<span className="mb-2 block text-cyan-100/80">End time</span>
								<input className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} />
							</label>
						</div>

						<div>
							<span className="mb-2 block text-sm text-cyan-100/80">Days of week</span>
							<div className="grid grid-cols-4 gap-2">
								{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, index) => (
									<button
										key={label}
										className={`rounded-2xl border px-3 py-2 text-sm ${form.daysOfWeek.includes(index) ? 'border-cyan-300 bg-cyan-300/20 text-white' : 'border-white/15 bg-slate-950 text-slate-300'}`}
										onClick={() => toggleDay(index)}
										type="button"
									>
										{label}
									</button>
								))}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block text-sm text-cyan-50">
								<span className="mb-2 block text-cyan-100/80">Valid from</span>
								<input className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" type="date" value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} />
							</label>
							<label className="block text-sm text-cyan-50">
								<span className="mb-2 block text-cyan-100/80">Valid until</span>
								<input className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" type="date" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} />
							</label>
						</div>

						<label className="block text-sm text-cyan-50">
							<span className="mb-2 block text-cyan-100/80">Slot interval mins</span>
							<input className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white" min="1" step="1" type="number" value={form.slotIntervalMins} onChange={(event) => setForm((current) => ({ ...current, slotIntervalMins: event.target.value }))} />
						</label>

						<div className="flex flex-wrap gap-3">
							<button className="rounded-2xl border border-cyan-300/40 bg-cyan-300/20 px-4 py-3 text-sm font-medium text-white" disabled={saving} type="submit">
								{editingScheduleId ? 'Update schedule' : 'Create schedule'}
							</button>
							{editingScheduleId ? (
								<button className="rounded-2xl border border-rose-300/40 bg-rose-300/20 px-4 py-3 text-sm font-medium text-white" disabled={saving} onClick={() => void handleDelete(editingScheduleId)} type="button">
									Delete schedule
								</button>
							) : null}
						</div>

						{status ? <p className="text-sm text-white">{status}</p> : null}
					</div>
				</form>

				<div className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5">
					<p className="mono text-xs uppercase tracking-[0.28em] text-cyan-200">Validation model</p>
					<ul className="mt-5 space-y-3 text-sm leading-6 text-cyan-50">
						{protections.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			</aside>
		</div>
	);
}