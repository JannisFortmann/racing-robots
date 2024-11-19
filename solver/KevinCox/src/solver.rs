struct AstarQueue<T> {
	queue: Vec<Vec<T>>,
	min: usize,
}

impl<T> AstarQueue<T> {
	fn new(first: T, score: usize) -> Self {
		let mut queue = Vec::new();
		queue.resize_with(score + 10, Default::default);
		queue[score] = vec![first];

		AstarQueue {
			queue,
			min: score,
		}
	}

	fn add(&mut self, e: T, score: usize) {
		debug_assert!(score >= self.min, "Score {} regressed from {}", score, self.min);
		let slot = score;

		if self.queue.len() <= slot {
			if self.queue.capacity() <= slot {
				self.queue.reserve(slot);
			}
			self.queue.resize_with(self.queue.capacity(), Default::default);
		}

		self.queue[slot].push(e);
	}

	fn pop(&mut self) -> Option<T> {
		while self.min < self.queue.len() {
			if let Some(e) = self.queue[self.min].pop() {
				return Some(e)
			}
			self.queue[self.min].shrink_to_fit();
			self.min += 1;
		}

		None
	}
}

fn make_array<T>(f: impl Fn() -> T) -> [T; 256] {
	[(); 256].map(|()| f())
}

struct LazyArray<T, const N: usize = 256>([Option<Box<T>>; N]);

impl <T: Default, const N: usize> LazyArray<T, N> {
	fn get_mut(&mut self, i: usize) -> &mut T {
		let slot = &mut self.0[i];
		slot.get_or_insert_with(Default::default)
	}
}

impl <T: Default, const N: usize> Default for LazyArray<T, N> {
	fn default() -> Self {
		LazyArray([(); N].map(|()| Default::default()))
	}
}

#[derive(Default)]
struct LazyVec<T>(Vec<T>);

impl <T: Default> LazyVec<T> {
	fn get_mut(&mut self, i: usize) -> &mut T {
		if self.0.len() <= i {
			self.0.resize_with(i + 1, Default::default);
		}
		&mut self.0[i]
	}
}


/// Funky custom data structure for storing visited nodes.
///
/// It allocates a lookup table for the first to robot positions upfront then
/// lazily allocates the rest. It also gives ids to the different positions
/// because the positions we see first tend to occur far more often then others
/// so we will allocate smaller vectors on average.
struct WeirdTrie<T> {
	positions: [[u8; 256]; 2],
	assigned_positions: [u8; 2],
	members: [LazyArray<LazyArray<LazyVec<LazyVec<T>>>>; 256],
}

impl<T: Default> WeirdTrie<T> {
	fn new() -> Self {
		WeirdTrie {
			positions: [[u8::max_value(); 256]; 2],
			assigned_positions: [0; 2],
			members: make_array(Default::default),
		}
	}

	fn get_pos_map(&mut self, robot: usize, pos: crate::Position) -> usize {
		let i = &mut self.positions[robot][usize::from(pos)];
		if *i == u8::max_value() {
			*i = self.assigned_positions[robot];
			self.assigned_positions[robot] += 1;
		}
		*i as usize
	}

	#[inline(always)]
	fn get_mut(&mut self, k: [crate::Position; 5]) -> &mut T {
		let r3 = self.get_pos_map(0, k[3]);
		let r4 = self.get_pos_map(1, k[4]);

		self.members[usize::from(k[0])]
			.get_mut(k[1].into())
			.get_mut(k[2].into())
			.get_mut(r3)
			.get_mut(r4)
	}
}

pub fn solve(mut game: crate::Game) -> crate::Solution {
	let robot_map = game.sort_robots();

	if game.is_solved() {
		// Starts solved or unsolvable.
		// Note: The rules have a funny special mode for this, we just ignore it and return 0 moves.
		return crate::Solution::new(game, Vec::new(), 0, robot_map)
	}

	let mut visited = WeirdTrie::new();

	let precompute = crate::Precompute::new(&game);

	#[derive(Copy,Clone)]
	struct History {
		depth_robot: u8, // 5 bit depth, 3 bit robot.
		prev: crate::Position,
	}

	impl History {
		fn depth(&self) -> u8 {
			self.depth_robot >> 3
		}

		fn robot(&self) -> crate::Robot {
			(self.depth_robot & 0b111).try_into().unwrap()
		}
	}

	impl Default for History {
		fn default() -> Self {
			History {
				depth_robot: u8::max_value(),
				prev: crate::Position::new(0, 0),
			}
		}
	}

	*visited.get_mut(game.robots()) = History {
		depth_robot: 0,
		prev: crate::Position::new(0, 0),
	};

	let score = precompute.estimate(&mut game);
	let mut queue = AstarQueue::new((game.robots(), 0), score as usize);

	let mut states = 0usize;
	while let Some((base_state, depth)) = queue.pop() {
		let depth = depth + 1;

		game.set_robots(base_state);
		for robot in crate::ROBOTS {
			for m in game.moves_for(robot) {
				let mut new_state = base_state;
				let sorted_robot = game.update_sorted_robot(&mut new_state, robot, m);
				let mut history = visited.get_mut(new_state);
				if history.depth() <= depth {
					continue
				}
				*history = History {
					depth_robot: depth << 3 | sorted_robot.as_u8(),
					prev: base_state[robot.as_u8() as usize],
				};
				states += 1;

				if game.target.matches(m, robot) {
					game.set_robots(new_state);
					let mut diffs = Vec::with_capacity(depth as usize);
					while history.depth() > 0 {
						let mut robots = game.robots();
						let sorted_robot = game.update_sorted_robot(
							&mut robots,
							history.robot(),
							history.prev);
						diffs.push(crate::Diff {
							position: game.robot(history.robot()),
							robot: sorted_robot,
						});
						game.set_robots(robots);
						history = visited.get_mut(game.robots());
					}
					debug_assert_eq!(diffs.len(), depth as usize);
					diffs.reverse();
					return crate::Solution::new(game, diffs, states, robot_map);
				}

				game.set_robot(robot, m);
				let estimate = precompute.estimate(&mut game);
				if estimate == u8::MAX {
					// Target is unreachable.
					continue
				}
				let score = estimate as usize + history.depth() as usize;
				queue.add((new_state, history.depth()), score);
			}

			game.set_robot(robot, base_state[robot.as_u8() as usize]);
		}
	}

	crate::Solution::new(game, Vec::new(), states, robot_map)
}
