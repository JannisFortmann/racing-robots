export abstract class KeyedSetBase<V, K> {
	protected abstract getKey(v: V): K;

	private map: Map<K, V> = new Map;

	constructor(
		values?: Iterable<V>,
	) {
		if (values) {
			this.extend(values);
		}
	}

	add(v: V): void {
		this.map.set(this.getKey(v), v);
	}

	extend(values: Iterable<V>): void {
		for (const v of values) {
			this.add(v);
		}
	}

	hasKey(k: K): boolean {
		return this.map.has(k);
	}

	has(v: V): boolean {
		return this.map.has(this.getKey(v));
	}
}

export class KeyedSet<V, K> extends KeyedSetBase<V, K> {
	constructor(
		protected readonly getKey: (v: V) => K,
		values?: Iterable<V>,
	) {
		super(values);
	}
}
