pub struct Precompute([[u8; 256]; 5]);

impl Precompute {
	pub fn new(game: &crate::Game) -> Self {
		Precompute(crate::ROBOTS.map(|r| Self::new_one(game, r)))
	}

	fn new_one(
		game: &crate::Game,
		color: crate::Robot,
	) -> [u8; 256] {
		let unset = u8::max_value();
		let mut score = [unset; 256];

		let mut todo = [crate::Position::new(0, 0); 256];
		let mut read = 0;
		let mut write = 1;

		todo[0] = game.target.position;
		score[usize::from(todo[0])] = 0;

		let board = game.board();

		while read < write {
			let position = todo[read];
			read += 1;

			let rank = score[usize::from(position)];

			for mut dir in crate::DIRECTIONS {
				let mut current = position;
				while !board.wall(current, dir) {
					current = current.move_towards(dir);

					let prev = score[usize::from(current)];
					if prev < rank {
						// Marked and neighbours would be at least as good as us.
						break
					} else if prev <= rank + 1 {
						// This cell is marked but it would mark future cells with a possibly higher rank.
						continue
					}
					debug_assert_eq!(prev, unset, "Out of order score at postition {current}.");

					if let Some(mirror) = board.mirror(current) {
						dir = mirror.exit_direction(color, dir);
						continue
					}

					score[usize::from(current)] = rank + 1;

					todo[write] = current;
					write += 1;
				}
			}
		}

		score
	}

	pub fn get_basic_minimum_distance(&self, color: crate::Robot, pos: crate::Position) -> u8 {
		self.0[usize::from(color.as_u8())][usize::from(pos)]
	}

	pub fn estimate(&self, game: &mut crate::Game) -> u8 {
		let mut robots = crate::ROBOTS;
		let mut len = robots.len();
		if let Some(robot) = game.target.robot {
			robots[0] = robot;
			len = 1;
		}

		// First find the robots that have the lowest minimum path if they could stop at any point.
		let mut min_robots = crate::ROBOTS;
		let mut min_robots_len = 0;
		let mut min = u8::max_value();
		for &robot in &robots[..len] {
			let pos = game.robot(robot);
			let optimistic = self.get_basic_minimum_distance(robot, pos);
			if optimistic > min {
				continue
			} else if optimistic < min {
				min = optimistic;
				min_robots[0] = robot;
				min_robots_len = 1;
			} else {
				min_robots[min_robots_len] = robot;
				min_robots_len += 1;
			}
		}

		if min == u8::MAX {
			return u8::MAX
		}

		// Then check that they are actually allowed to turn at those points.
		// If not we add a penalty of 1.
		// I'm not sure that we can add a more accurate penalty due to the number of possible paths which we would need to count the minimum. It would likely be too expensive. We would basically be solving a sub-search just moving a single robot.

		for &robot in &min_robots[..min_robots_len] {
			let pos = game.robot(robot);
			let min_possible = self.is_minimum_possible(game, min, robot);
			game.set_robot(robot, pos);
			if min_possible {
				return min
			}
		}

		min + 1
	}


	fn is_minimum_possible(
		&self,
		game: &mut crate::Game,
		optimistic: u8,
		robot: crate::Robot,
	) -> bool {
		for new_pos in game.moves_for(robot) {
			let next_score = self.get_basic_minimum_distance(robot, new_pos);
			if next_score >= optimistic {
				continue
			}
			debug_assert_eq!(next_score, optimistic - 1);
			if next_score == 0 {
				return true
			}
			game.set_robot(robot, new_pos);
			if self.is_minimum_possible(game, next_score, robot) {
				return true
			}
		}

		false
	}

}
