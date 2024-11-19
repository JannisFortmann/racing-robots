#[derive(Eq,Clone,Copy,Default,PartialEq)]
pub struct Cell {
	walls: u8,
}

impl Cell {
	pub const NO_WALLS: Cell = Cell { walls: 0 };

	pub const N: Cell = Cell { walls: crate::Direction::N.to_bit() };
	pub const W: Cell = Cell { walls: crate::Direction::W.to_bit() };

	pub const NE: Cell = Cell { walls: crate::Direction::N.to_bit() | crate::Direction::E.to_bit() };
	pub const NW: Cell = Cell { walls: crate::Direction::N.to_bit() | crate::Direction::W.to_bit() };
	pub const SE: Cell = Cell { walls: crate::Direction::S.to_bit() | crate::Direction::E.to_bit() };
	pub const SW: Cell = Cell { walls: crate::Direction::S.to_bit() | crate::Direction::W.to_bit() };

	pub fn from_u4(walls: u8) -> Self {
		debug_assert!(walls <= 0x0F);
		Cell{walls}
	}

	pub fn set_wall_to(&mut self, d: crate::Direction, present: bool) {
		self.walls &= !d.to_bit();
		self.walls |= (present as u8) << u8::from(d);
	}

	pub fn set_wall(&mut self, d: crate::Direction) {
		self.walls |= d.to_bit();
	}

	pub fn has_wall(&self, d: crate::Direction) -> bool {
		self.walls & d.to_bit() != 0
	}

	pub fn wall_count(&self) -> u8 {
		self.walls.count_ones().try_into().unwrap()
	}

	pub fn is_corner(self) -> bool {
		self == Cell::NE || self == Cell::NW || self == Cell::SE || self == Cell::SW
	}

	pub fn rotate_cw_times(&self, times: u8) -> Self {
		let mut r = Cell::NO_WALLS;
		for d in crate::DIRECTIONS {
			if self.has_wall(d) {
				r.set_wall(d.rotate_cw_times(times));
			}
		}
		r
	}

	pub fn as_u4(&self) -> u8 {
		self.walls
	}

	pub fn serialize(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		match (self.has_wall(crate::Direction::N), self.has_wall(crate::Direction::W)) {
			(true,  true ) => write!(out, "B"),
			(true,  false) => write!(out, "N"),
			(false, true ) => write!(out, "W"),
			(false, false) => write!(out, "C"),
		}
	}
}

impl std::fmt::Debug for Cell {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		write!(f, "Cell(")?;
		for d in crate::DIRECTIONS {
			if self.has_wall(d) {
				write!(f, "{}", d)?;
			}
		}
		write!(f, ")")
	}
}
