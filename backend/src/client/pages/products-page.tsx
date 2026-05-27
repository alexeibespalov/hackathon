import { useEffect, useState } from 'react';

import type { ProductSummary } from '../../types';

export function ProductsPage() {
	const [products, setProducts] = useState<ProductSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;

		void (async () => {
			try {
				const response = await fetch('/api/products');
				const data = (await response.json()) as ProductSummary[];

				if (active) {
					setProducts(data);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h3 className="text-2xl font-semibold tracking-tight text-white">Products</h3>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
						Every product will carry its own capacity, slot duration, and timezone so schedule math stays explicit.
					</p>
				</div>
				<button className="rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20">
					Add product
				</button>
			</header>

			<div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
				<div className="grid grid-cols-[1.3fr_0.8fr_1fr_0.8fr] gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.25em] text-slate-400">
					<span>Name</span>
					<span>Type</span>
					<span>Location / Timezone</span>
					<span className="text-right">Capacity</span>
				</div>
				{loading ? (
					<div className="px-5 py-10 text-sm text-slate-300">Loading product configuration surface...</div>
				) : products.length === 0 ? (
					<div className="px-5 py-10 text-sm leading-6 text-slate-300">
						No products yet. CAP-12 will wire create and edit flows here.
					</div>
				) : (
					products.map((product) => (
						<div key={product.id} className="grid grid-cols-[1.3fr_0.8fr_1fr_0.8fr] gap-4 border-t border-white/5 px-5 py-4 text-sm text-slate-200">
							<div>
								<p className="font-medium text-white">{product.name}</p>
								<p className="mt-1 text-slate-400">{product.description}</p>
							</div>
							<span>{product.type}</span>
							<span>{product.location} / {product.timezone}</span>
							<span className="text-right mono">{product.capacity}</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}