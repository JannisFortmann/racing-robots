#[derive(Eq,Debug,PartialEq)]
pub struct Diff {
	pub robot: crate::Robot,
	pub position: crate::Position,
}

#[derive(serde::Deserialize,serde::Serialize)]
struct State {
	robot: crate::Robot,
	direction: crate::Direction,
	robots: [crate:: Position; 5],
}

impl State {
	pub fn serialize(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		let pos = self.robots[self.robot as usize];
		writeln!(out, "move {} {} {}", self.robot.as_u8(), pos.x(), pos.y())
	}
}

#[derive(serde::Deserialize,serde::Serialize)]
pub struct Solution {
	pub game: crate::Game,
	steps: Vec<State>,
	pub visited_states: usize,
}

impl Solution {
	pub fn new(
		mut game: crate::Game,
		diffs: Vec<Diff>,
		visited_states: usize,
		mut robot_map: [crate::Robot; 5],
	) -> Self {
		game.unsort_robots(robot_map);

		let start_robots = game.robots();
		let mut steps = Vec::with_capacity(diffs.len());

		for Diff{robot, position} in diffs {
			let robot = robot_map[robot.as_u8() as usize];
			let from = game.robot(robot);

			let direction = crate::DIRECTIONS.into_iter()
				.find(|dir| game.move_towards(robot, *dir) == Some(position))
				.unwrap_or_else(|| {
					panic!("Invalid move {:?} {} -> {}. Game:{:?}",
						robot,
						from, position,
						game);
				});

			game.set_robot(robot, position);

			robot_map = game.robot_normalization_mapping();

			steps.push(State {
				robot,
				direction,
				robots: game.robots(),
			})
		}

		game.set_robots(start_robots);

		Solution {
			game,
			steps,
			visited_states,
		}
	}

	pub fn len(&self) -> usize {
		self.steps.len()
	}

	pub fn step(&self, i: usize) -> Step {
		let step = &self.steps[i];

		let mut source_game = self.game.clone();
		if i > 0 {
			source_game.set_robots(self.steps[i - 1].robots);
		}

		Step {
			source_game,
			robot: step.robot,
			direction: step.direction,
			end: step.robots[step.robot as usize],
		}
	}

	pub fn serialize(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		writeln!(out, "solution {}", self.steps.len())?;

		for step in &self.steps {
			step.serialize(out)?;
		}

		Ok(())
	}
}

impl<'a> IntoIterator for &'a Solution {
	type Item = Step;
	type IntoIter = SolutionIter<'a>;

	fn into_iter(self) -> SolutionIter<'a> {
		SolutionIter {
			solution: self,
			step: 0,
		}
	}
}

pub struct Step {
	source_game: crate::Game,
	pub robot: crate::Robot,
	pub direction: crate::Direction,
	end: crate::Position,
}

impl Step {
	pub fn source_game(&self) -> &crate::Game {
		&self.source_game
	}

	pub fn resulting_game(&self) -> crate::Game {
		let mut game = self.source_game.clone();
		game.set_robot(self.robot, self.end);
		game
	}

	pub fn trace(&mut self) -> impl '_ + Iterator<Item=crate::Position> {
		self.source_game.trace(self.robot, self.direction)
	}
}

pub struct SolutionIter<'a> {
	solution: &'a Solution,
	step: usize,
}

impl<'a> Iterator for SolutionIter<'a> {
	type Item = Step;

	fn next(&mut self) -> Option<Step> {
		if self.step >= self.solution.steps.len() {
			return None
		}

		let step = self.solution.step(self.step);
		self.step += 1;
		Some(step)
	}
}
