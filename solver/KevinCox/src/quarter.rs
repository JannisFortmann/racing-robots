#[derive(Copy,Clone)]
pub struct Quarter {
	vertical_walls: [u8; 8],
	horizontal_walls: [u8; 8],
	pub mirrors: Option<[(crate::Position, crate::Mirror); 2]>,
}

impl Quarter {
	pub fn cell(&self, pos: crate::Position) -> crate::Cell {
		let mut r = crate::Cell::NO_WALLS;
		let x = pos.x() as usize;
		let y = pos.y() as usize;
		if y == 0 || self.horizontal_walls[x] & 1 << (8-y) != 0 {
			r.set_wall(crate::Direction::N);
		}
		if self.horizontal_walls[x] & 1 << (7-y) != 0 {
			r.set_wall(crate::Direction::S);
		}
		if x == 0 || self.vertical_walls[y] & 1 << (8-x) != 0 {
			r.set_wall(crate::Direction::W);
		}
		if self.vertical_walls[y] & 1 << (7-x) != 0 {
			r.set_wall(crate::Direction::E);
		}
		r
	}
}

pub static KNOWN_QUARTERS: [[Quarter; 4]; 4] = [
	[ // RED
		Quarter {
			vertical_walls: [
				0b00001000,
				0b00000000,
				0b00000010,
				0b00000000,
				0b00100000,
				0b00000000,
				0b00001000,
				0b00000011,
			],
			horizontal_walls: [
				0b00100000,
				0b00000000,
				0b00010000,
				0b00001000,
				0b00000000,
				0b00000100,
				0b00100000,
				0b00000011,
			],
			mirrors: Some([
				(crate::Position::new(4, 1), crate::Mirror::new(true, crate::Robot::BLUE)),
				(crate::Position::new(6, 3), crate::Mirror::new(true, crate::Robot::YELLOW)),
			]),
		},
		Quarter {
			vertical_walls: [
				0b01000000,
				0b00001000,
				0b00000000,
				0b10000000,
				0b00000000,
				0b00001000,
				0b00010000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000100,
				0b00010000,
				0b00000000,
				0b00000010,
				0b10000000,
				0b00001000,
				0b00000000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00010000,
				0b10000000,
				0b00000010,
				0b00000000,
				0b00100000,
				0b00000010,
				0b00000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000100,
				0b01000000,
				0b00001000,
				0b00000000,
				0b00000000,
				0b00000000,
				0b01000000,
				0b00001011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00010000,
				0b00000000,
				0b00000100,
				0b00000000,
				0b00100000,
				0b00000010,
				0b10000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00001000,
				0b00000100,
				0b00010000,
				0b00000000,
				0b00000000,
				0b00100000,
				0b00000000,
				0b00000111,
			],
			mirrors: None,
		},
	], [ // GREEN
		Quarter {
			vertical_walls: [
				0b00000100,
				0b00000000,
				0b00000000,
				0b10000000,
				0b00000010,
				0b00000000,
				0b00100000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000100,
				0b00100000,
				0b00000100,
				0b00000010,
				0b00000000,
				0b00000000,
				0b00001000,
				0b00000011,
			],
			mirrors: Some([
				(crate::Position::new(4, 1), crate::Mirror::new(false, crate::Robot::GREEN)),
				(crate::Position::new(5, 7), crate::Mirror::new(true, crate::Robot::YELLOW)),
			]),
		},
		Quarter {
			vertical_walls: [
				0b01000000,
				0b00100000,
				0b00000000,
				0b00000010,
				0b10000000,
				0b00000000,
				0b00001000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000010,
				0b00001000,
				0b00000000,
				0b10000000,
				0b00000100,
				0b00000000,
				0b00010000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00001000,
				0b00000010,
				0b10000000,
				0b00000000,
				0b00000000,
				0b00000010,
				0b00100000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000100,
				0b01000000,
				0b00000000,
				0b00000010,
				0b00000000,
				0b00000000,
				0b01001000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b01000000,
				0b00010000,
				0b01000000,
				0b00000010,
				0b00000000,
				0b00000000,
				0b00100000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000100,
				0b01000000,
				0b00000000,
				0b00000010,
				0b10000000,
				0b00000000,
				0b00010000,
				0b00000011,
			],
			mirrors: None,
		},
	], [ // YELLOW
		Quarter {
			vertical_walls: [
				0b00001000,
				0b00000000,
				0b00000100,
				0b00100000,
				0b00000000,
				0b01000000,
				0b00000000,
				0b00000111,
			],
			horizontal_walls: [
				0b00000010,
				0b00000100,
				0b00100000,
				0b00010000,
				0b00000000,
				0b00000001,
				0b01000000,
				0b00000011,
			],
			mirrors: Some([
				(crate::Position::new(2, 1), crate::Mirror::new(true, crate::Robot::RED)),
				(crate::Position::new(3, 6), crate::Mirror::new(true, crate::Robot::GREEN)),
			]),
		},
		Quarter {
			vertical_walls: [
				0b00100000,
				0b00001000,
				0b00000001,
				0b00000000,
				0b00010000,
				0b00000100,
				0b01000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00010000,
				0b00000100,
				0b00000000,
				0b00001000,
				0b00000000,
				0b01000000,
				0b00001000,
				0b00100011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00001000,
				0b00100000,
				0b00000000,
				0b10000000,
				0b00000100,
				0b00000000,
				0b00000100,
				0b00010011,
			],
			horizontal_walls: [
				0b00001000,
				0b00010000,
				0b01000000,
				0b00000001,
				0b00000000,
				0b00000100,
				0b00010000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00010000,
				0b00000100,
				0b00000000,
				0b01000000,
				0b00001000,
				0b00100001,
				0b00000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00000010,
				0b00100000,
				0b00000100,
				0b00000000,
				0b00000000,
				0b00010000,
				0b01000000,
				0b00000111,
			],
			mirrors: None,
		},
	], [ // BLUE
		Quarter {
			vertical_walls: [
				0b00100000,
				0b00000000,
				0b00000100,
				0b00000000,
				0b00000000,
				0b10000000,
				0b00000000,
				0b00001011,
			],
			horizontal_walls: [
				0b00000010,
				0b00000100,
				0b00000000,
				0b00000000,
				0b00000010,
				0b00100000,
				0b01000000,
				0b00000011,
			],
			mirrors: Some([
				(crate::Position::new(2, 1), crate::Mirror::new(false, crate::Robot::BLUE)),
				(crate::Position::new(7, 4), crate::Mirror::new(true, crate::Robot::RED)),
			]),
		},
		Quarter {
			vertical_walls: [
				0b00000100,
				0b00000000,
				0b00100000,
				0b00001000,
				0b00100000,
				0b00001000,
				0b00000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00010000,
				0b00000000,
				0b00010000,
				0b01000000,
				0b00000100,
				0b00010000,
				0b00000000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00001000,
				0b01000000,
				0b00000000,
				0b00000100,
				0b00000000,
				0b00001000,
				0b01000000,
				0b00000011,
			],
			horizontal_walls: [
				0b00001000,
				0b00000010,
				0b10000000,
				0b00000000,
				0b00001000,
				0b00000000,
				0b00010000,
				0b00000011,
			],
			mirrors: None,
		},
		Quarter {
			vertical_walls: [
				0b00010000,
				0b00000100,
				0b10000000,
				0b00000000,
				0b00000100,
				0b00000000,
				0b00100000,
				0b00000011,
			],
			horizontal_walls: [
				0b00010000,
				0b00100000,
				0b00000100,
				0b00000000,
				0b00000000,
				0b01000000,
				0b00010000,
				0b00000011,
			],
			mirrors: None,
		},
	],
];
