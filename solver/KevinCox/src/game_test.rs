#[test]
fn test_trace() {
	let mut board = crate::Board::empty();
	board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[0][0]);
	board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[1][0]);
	board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[2][0]);
	board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[3][0]);
	let robots = [
		crate::Position::new(0, 0),
		crate::Position::new(4, 0),
		crate::Position::new(0, 1),
		crate::Position::new(0, 3),
		crate::Position::new(0, 4),
	];
	let target = crate::Target {
		position: crate::Position::new(0, 0),
		robot: None,
	};
	let game = crate::Game::new(board, robots, target);
	eprintln!("{:?}", game);

	let mut trace = Vec::new();

	trace.splice(.., game.trace(crate::Robot::BLACK, crate::Direction::E));
	assert_eq!(trace, &[crate::Position::new(3, 0)]);

	trace.splice(.., game.trace(crate::Robot::GREEN, crate::Direction::E));
	assert_eq!(trace, &[
		crate::Position::new(4, 1),
		crate::Position::new(4, 8),
		crate::Position::new(0, 8),
	]);

	trace.splice(.., game.trace(crate::Robot::YELLOW, crate::Direction::E));
	assert_eq!(trace, &[crate::Position::new(8, 3)]);

	trace.splice(.., game.trace(crate::Robot::RED, crate::Direction::S));
	assert_eq!(trace, &[crate::Position::new(4, 1), crate::Position::new(12, 1)]);
}

#[test]
fn test_driftingdroids() {
	let mut board = crate::Board::empty();
	board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[2][0]);
	board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[3][2]);
	board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[0][3]);
	board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[1][2]);

	let mut game = crate::Game::new(
		board,
		[
			crate::Position::new(1, 0),
			crate::Position::new(12, 15),
			crate::Position::new(9, 8),
			crate::Position::new(3, 2),
			crate::Position::new(0, 14),
		],
		crate::Target {
			position: crate::Position::new(12, 6),
			robot: Some(crate::Robot::BLUE),
		});
	dbg!(&game);

	assert_eq!(game.to_driftingdroids(), Some("F524+52+FC89E02301+6C".into()));

	board.set_wall(crate::Position::new(4, 5), crate::Direction::N);
	game.set_board(board);
	dbg!(&game);

	assert_eq!(game.to_driftingdroids(), None);

	let game = crate::Game::from_driftingdroids("C93A+53+2C410F8FE1+46").unwrap();
	dbg!(&game);
	assert_eq!(game.to_driftingdroids(), Some("C93A+53+2C410F8FE1+46".into()));

	let game = crate::Game::from_driftingdroids("9FA0+51+DF8A5BADB0+3C").unwrap();
	dbg!(&game);
	assert_eq!(game.to_driftingdroids(), Some("9FA0+51+DF8A5BADB0+3C".into()));

	// Note: Funny yellow tiles with edge walls.
	let game = crate::Game::from_driftingdroids("7FF7+53+1B60F2D60B+6D").unwrap();
	dbg!(&game);
	assert_eq!(game.to_driftingdroids(), Some("7FF7+53+1B60F2D60B+6D".into()));
}
