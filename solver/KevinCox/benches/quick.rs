fn e2e(c: &mut criterion::Criterion) {
	c.bench_function("e2e 8", |b| b.iter(|| {
		let input = r"board 16 16
B N N N B N N N N N N B N N N N
W C C C C C C C C W C C C C C C
W C C C C C C C C N C C C C N W
W C C C C N C C C C C C C C C C
W C N W C C C C C C C W C C C C
B C C C C C C W C C N C C C C N
W B C C C C C N C C C C B C C C
W C C C C C C B B W C C C C C C
W C C C C C C B B W C C C C C C
W C C N W C C N N C C C C C C N
W C C C C C C C B C C C C B C C
W W C C C C C C C C C W C C C C
W N C C C C C W C C N C C C W C
W C C C C C C C C C C C C C N C
B C B C C C C C C N W C C C C C
W C C C C C W C C C C C W C C C
robots 5
0 0
1 0
2 0
3 0
4 0
target 0 15 12 4
";
		let game = ricochetrobots::parse(&mut std::io::Cursor::new(input)).unwrap();
		assert_eq!(ricochetrobots::solve(game).len(), 8);
	}));
}

criterion::criterion_group!(benches,
	e2e,
);
criterion::criterion_main!(benches);
