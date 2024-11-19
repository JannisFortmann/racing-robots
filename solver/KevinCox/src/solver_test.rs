pub fn game() -> crate::Game {
	crate::parse_str(r"board 16 16
B N N B N N N N N N N N N B N N
W C C C C C C C C C C C C C C C
W C C C C C B C C C C C W C C C
W C C C C N C C C C C W C C C C
W C C C C C C C C C C C C C C C
W W C C C C C C C N W C C C C N
W N C C C C C C C C C C C W C C
B C C C N W C B B W C C C N C C
W C C C C C C B B W C C C C C C
W C W C C C C N N C C C N W C C
W C N C C C C N W C C C C N C N
B C C C C C C C C W C C C C C C
W C C C W C C C C C C C C C C W
W C C B C C C C C C C C C C N C
W C C C C N W C C C C C C C C C
W C C C C C C W C C W C C C C C
mirrors 8
2 1 / 4
7 4 \ 1
14 4 / 4
12 6 / 3
10 8 \ 3
6 12 / 2
1 13 / 1
11 14 / 2
robots 5
6 0
5 14
0 15
2 9
13 6
target 0 6 14 1
").unwrap()
}

#[test]
fn precompute() {
	eprintln!("{:?}", game());
	let precompute = crate::Precompute::new(&game());
	assert_eq!(
		crate::Position::iter_ordered()
			.map(|p| precompute.get_basic_minimum_distance(crate::Robot::RED, p))
			.collect::<Vec<_>>(),
		&[
			3,   3,   4,   2,   2,   2,   2,   2,   2,   2,   2,   1,   2,   3,   2,   3,
			3,   3, 255,   2,   2,   2,   2,   2,   2,   2,   2,   1,   2,   2,   2,   2,
			3,   3,   2,   3,   3,   3,   2,   2,   2,   2,   2,   1,   2,   3,   2,   3,
			3,   3,   2,   3,   3,   3,   3,   3,   3,   3,   2,   1,   2,   2,   2,   2,
			2,   2,   2,   2,   2,   2,   2, 255,   2,   2,   2,   1,   2,   2, 255,   2,
			3,   3,   2,   3,   3,   3,   3,   3,   3,   2,   2,   1,   2,   2,   2,   2,
			2,   2,   2,   2,   2,   2,   2,   2,   2,   2,   2,   1, 255,   3,   2,   3,
			3,   3,   2,   3,   3,   3,   3, 255, 255,   2,   2,   1,   2,   2,   2,   2,
			3,   3,   2,   3,   3,   3,   3, 255, 255,   2, 255,   1,   2,   2,   2,   2,
			4,   3,   2,   2,   2,   2,   2,   2,   2,   2,   2,   1,   2,   3,   2,   3,
			3,   3,   3,   3,   3,   3,   3,   2,   2,   2,   2,   1,   2,   2,   2,   2,
			3,   3,   3,   3,   3,   3,   3,   2,   2,   2,   2,   1,   2,   2,   2,   2,
			3,   3,   3,   3,   3,   3, 255,   1,   1,   1,   1,   1,   1,   1,   1,   3,
			3, 255,   3,   2,   2,   2,   1,   2,   2,   2,   2,   1,   2,   2,   2,   2,
			3,   3,   3,   3,   3,   3,   0,   1,   1,   1,   1, 255,   2,   2,   3,   3,
			2,   2,   2,   2,   2,   2,   1,   2,   2,   2,   2,   3,   2,   2,   3,   3,
		]);
}
