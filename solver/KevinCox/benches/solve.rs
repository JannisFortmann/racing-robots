fn fast(c: &mut criterion::Criterion) {
	let mut group = c.benchmark_group("fast");
	group.sample_size(50);
	group.sampling_mode(criterion::SamplingMode::Flat);
	group.warm_up_time(std::time::Duration::from_millis(200));

	let games = [
		"games/11-mirrors.txt",
		"tests/solutions/10.txt",
		"tests/solutions/2019-04-20_12.txt",
	];
	for path in games {
		let f = std::fs::File::open(path).unwrap();
		let f = std::io::BufReader::new(f);
		let game = ricochetrobots::parse(f).unwrap();
		group.bench_with_input(
			criterion::BenchmarkId::from_parameter(path),
			&game,
			|b, game| b.iter(|| ricochetrobots::solve(game.clone()).len()));
	}
}

fn slow(c: &mut criterion::Criterion) {
	let mut group = c.benchmark_group("slow");
	group.sample_size(15);
	group.sampling_mode(criterion::SamplingMode::Flat);
	group.warm_up_time(std::time::Duration::from_millis(200));

	let games = [
		"games/14-polymorphicprism-83.txt",
		"games/17-rotated.txt",
		"games/17.txt",
		"games/20-mirrors.txt",
		"games/michael-fogleman.txt",
	];
	for path in games {
		let f = std::fs::File::open(path).unwrap();
		let f = std::io::BufReader::new(f);
		let game = ricochetrobots::parse(f).unwrap();
		group.bench_with_input(
			criterion::BenchmarkId::from_parameter(path),
			&game,
			|b, game| b.iter(|| ricochetrobots::solve(game.clone()).len()));
	}
}

criterion::criterion_group!(benches,
	fast,
	slow,
);
criterion::criterion_main!(benches);
