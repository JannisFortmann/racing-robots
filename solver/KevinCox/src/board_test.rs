pub fn b1() -> crate::Board {
	crate::parse_board_str(r"board 16 16
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
W C C C C C C C C C C C C C C C
B C B C C C C C C N W C C C C C
W C C C C C W C C C C C W C C C
").unwrap()
}

pub fn b2() -> crate::Board {
	crate::parse_board_str(r"board 16 16
B N N B N N N N N N N N N B N N
W C C C C C C C C C C C C C C C
W C C C C C B C C C C C W C C C
W C C C C N C C C C C B C C C C
W C C C C C C C C C C C C C C C
W W C C C C C C C N W C C C C N
W N C C C C C C C C C C C W C C
B C C C N W C B B W C C C N C C
W C C C C C C B B W B C C C C C
W C C C N W C N N C C C C C C N
B C C C C C C C C C C C C C B C
W C C C C C C C C C C C C C C C
W C C C C C C W C C C C N W C C
W C C C C C B C C C W C C N C C
W C C W C C C C C N C C C C C C
W C C N C C W C C C C W C C C C
mirrors 8
2 1 / 4
7 4 \ 1
14 4 / 4
12 6 / 3
1 11 \ 2
7 10 / 3
12 9 \ 2
13 14 \ 1
").unwrap()
}

#[test]
fn walls() {
	assert_eq!(b1().cell(crate::Position::new(2, 14)), crate::Cell::NW);
}

#[test]
fn apply_quarter() {
	let mut board = b1();
	board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[3][0]);
	board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[0][0]);
	board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[2][0]);
	board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[1][0]);
	assert_eq!(board, b2());
}

#[test]
fn test_quadrants() {
	let mut board = crate::Board::empty();
	board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[0][3]);
	board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[1][2]);
	board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[2][3]);
	board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[3][2]);

	assert_eq!(board, crate::parse_board_str(r"board 16 16
B N N N B N N N N N B N N N N N
W C C C C C C C C C C C C N W C
W C C C C C W C C C C C C C C C
W C C C C N C C C B C C C C C C
W C N W C C C C C C C C C C C C
B C C C C C C W C C C C C C C N
W B C C C C C N C C C W C C W C
W C C C C C C B B W N C C C N C
W C C C C C C B B W C C C C C C
W C C C W C C N N C C C C C C N
W C C N C C C C B C C C C B C C
B C C C C B C C C C C W C C C C
W C C C C C C C C C N C C C W C
W W C C C C C C C C C C C C N C
W N C C C C N W C N W C C C C C
W C C C C W C C C C C C W C C C
mirrors 0
").unwrap());
}

#[test]
fn test_quadrant_edge() {
	let mut board = crate::Board::empty();
	board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[2][0]);
	board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[3][2]);
	board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[0][3]);
	board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[1][2]);

	assert_eq!(board, crate::parse_board_str(r"board 16 16
B N N N N B N N N N N B N N N N
W C C C C C C C C W C C C C C C
W C C C C C B C C N C C C C N W
W C N W C C C C C C C C C C C C
W C C N C C C C C C C W C C C C
W C W C C C C C C C N C C C C N
W N C C C C C C C C C C B C C C
B C C C C C W B B W C C C C C C
W C C C C N C B B W C C C C C C
W N W C C B C N N C C C C C C W
W C C C C C C C N W C C C C N C
B C C C C C C C C C C C C W C N
W C C C C C C W C C C C C N C C
W C C C C C N C C C B C C C C C
W C W C C C C C C C C C C C C C
W C N C C C W C C C C C W C C C
mirrors 2
2 1 \ 1
3 6 \ 2
").unwrap());
	assert_eq!(board.to_driftingdroids(), Some("F524".into()))
}

#[test]
fn test_target_candidates() {
	// Note: Order doesn't matter.

	assert_eq!(
		b1().target_candidates().collect::<Vec<_>>(),
		&[
			crate::Position::new(9, 1),
			crate::Position::new(14, 2),
			crate::Position::new(2, 4),
			crate::Position::new(10, 4),
			crate::Position::new(7, 5),
			crate::Position::new(1, 6),
			crate::Position::new(12, 6),
			crate::Position::new(3, 9),
			crate::Position::new(8, 10),
			crate::Position::new(13, 10),
			crate::Position::new(1, 11),
			crate::Position::new(10, 11),
			crate::Position::new(2, 14),
			crate::Position::new(9, 14),
		]);

	assert_eq!(
		b2().target_candidates().collect::<Vec<_>>(),
		&[
			crate::Position::new(5, 2),
			crate::Position::new(6, 2),
			crate::Position::new(11, 2),
			crate::Position::new(11, 3),
			crate::Position::new(1, 5),
			crate::Position::new(9, 5),
			crate::Position::new(13, 6),
			crate::Position::new(4, 7),
			crate::Position::new(10, 8),
			crate::Position::new(4, 9),
			crate::Position::new(14, 10),
			crate::Position::new(6, 12),
			crate::Position::new(12, 12),
			crate::Position::new(13, 12),
			crate::Position::new(6, 13),
			crate::Position::new(9, 13),
			crate::Position::new(3, 14),
		]);
}
